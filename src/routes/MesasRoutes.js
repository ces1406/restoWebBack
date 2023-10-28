const {Router} = require('express');
const {Pedidos,Comensales,Platos,start, Mesas} = require('../model/db');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {Op} = require('sequelize');
const axios = require('axios')

class MesasRoutes{
    constructor(){
        this.router = Router();
        start();
        this.routes();
        this.datos ={};
    }
    crearToken = (idmesa,idcli)=>{
        return jwt.sign({idMesa:idmesa,idCliente:idcli}, process.env.JWT_KEY, {expiresIn: process.env.JWT_LIFETIME});
    }
    checkjwt = (req,res,next)=>{         
            try {
                const auth = req.get('authorization')
                let token='';
                if(auth && auth.toLowerCase().startsWith('bearer')){
                    token = auth.substring(7)
                    this.datos = jwt.verify(token,process.env.JWT_KEY,{expiresIn:process.env.JWT_LIFETIME});             
                }                 
                next()
            } catch (error) {
                res.status(404).send()
             }
    }
    routes(){
        this.router.get('/qr/:id',async(req,res)=>{
            try{
                const hash = bcrypt.hashSync((process.env.KEY_QR+req.params.id), 10);
                console.log("process.env.SERVER_URL: ",process.env.SERVER_URL)
                const QR = await qrcode.toDataURL(process.env.SERVER_URL+'/mesas/registrarse/'+req.params.id+'/'+btoa(hash))
                res.status(200).send(`<div style ="display: flex; justifi-content:center; align-items:center"> <img src="${QR}"/></div>`);
                //res.status(200).json({rta:'localhost:5000/mesas/registrarse/'+req.params.id+'/'+btoa(hash)})
            }catch(e){
                return res.status(500).send();
            }
        })
        this.router.post('/registrarse/:idMesa/:hash',async(req,res)=>{
            try {
                if (bcrypt.compareSync(process.env.KEY_QR+req.params.idMesa,atob(req.params.hash))){
                    await Comensales.update({idMesa:req.params.idMesa,estado:'SENTADO'},{where:{idCliente:req.body.idCliente}});
                    await Mesas.update({estado:'OCUPADA'},{where:{idMesa:req.params.idMesa}})
                    return res.status(200).json({token:this.crearToken(req.params.idMesa,req.body.idCliente)})
                }else{
                    return res.status(404).send()
                }
            } catch (error) {
                return res.status(500).send()
            }
        })        
        this.router.post('/ordenar/:idMesa/:idCliente',this.checkjwt ,async(req,res)=>{
            //let peds=[]
            //console.log('body',req.body)
           // const datos = await this.checkjwt(req,res);
            //console.log('datos',this.datos)
            req.body.ordenes.forEach(e => {
                //console.log('e->',JSON.stringify(e))
                Pedidos.create({
                //peds.push({
                    idMesa:req.params.idMesa,//this.datos.idMesa,
                    idCliente:req.params.idCliente,//this.datos.idCliente,
                    idPlato:e.idPlato,
                    cantidad: e.cantidad,
                    estado:'PREPARANDO',
                    cancelable: true,
                    horaPedido:(new Date()).toLocaleString('sv-SE',{timeZone:'America/Argentina/Buenos_Aires'})         
                });
            });
            res.status(200).json({msg:'ok'})
            //res.status(200).json({peds})
        })

        this.router.get('/pagar/individual/:idCliente',this.checkjwt,async(req,res)=>{
            const pedidos = await Pedidos.findAll(/*{
                include:[{
                    model: Comensales,
                    required: true,
                    attributes:['idCliente']
                }]
            },*/{where:{
                [Op.and]:[
                    {idCliente:req.params.idCliente},
                    {estado:{[Op.like]:'ENTREGADO'}}
                ]
            }});
            for await(let ped of pedidos){
                await Pedidos.update({estado:'PAGANDO'},{where:{idPedido:ped.idPedido}})
            }
            res.status(200).json(pedidos)
        })

        this.router.post('/pagar/varios/:idCliente',this.checkjwt,async(req,res)=>{
            const pedidos = await Pedidos.findAll(
                {where:{ [Op.and]:[{idCliente:req.params.idCliente},{estado:{[Op.like]:'ENTREGADO'}}]}}
            );
            for await(let ped of pedidos){
                await Pedidos.update({estado:'PAGANDO'},{where:{idPedido:ped.idPedido}})
            }
            req.body.pagoscli.forEach(e=>{
                Pedidos.update( {estado:'PAGANDO'},{where:{[Op.and]:[{idCliente:e},{estado:'ENTREGADO'}]}} )
            })
            res.status(200).json({msg:'ok'})
        })

        this.router.get('/pagar/dividido/:idMesa/:idCliente',this.checkjwt,async(req,res)=>{
            let amigos = await Comensales.findAll({
                    include:[{
                        model:Mesas,
                        required:true
                    }],
                    where:{idMesa:req.params.idMesa}
                })
            let config = {
                headers:{
                    'Content-Type':'application/json',
                    Authorization:'key='+process.env.FCBKEY
                }
            }
            let body = {
                registration_ids:amigos.map(e=>e.idFcb),
                notification: {title:'Pedido de cuenta',body:'El cliente ha pedido dividir la cuenta en partes iguales'},
                direct_boot_ok: true
            }
            const rta = await axios.post(process.env.FCB_URL,body,config);
            res.status(200).json({msg:'ok'})
        })

        /*this.router.get('/pagar/varios/aceptar/:idMesa/:idCliente',this.checkjwt,async(req,res)=>{
            const cantAceptaron = await Comensales.count({where:{}})

            const pedidos = await Pedidos.findAll(
                {where:{ [Op.and]:[{idCliente:req.params.idCliente},{estado:{[Op.like]:'ENTREGADO'}}]}}
            );
            for await(let ped of pedidos){
                await Pedidos.update({estado:'PAGANDO'},{where:{idPedido:ped.idPedido}})
            }
            req.body.pagoscli.forEach(e=>{
                Pedidos.update( {estado:'PAGANDO'},{where:{[Op.and]:[{idCliente:e},{estado:'ENTREGADO'}]}} )
            })
            res.status(200).json({msg:'ok'})
        })

        this.router.post('/pagar/desafio/:idMesa',this.checkjwt,async(req,res)=>{
            //console.log('garping')
            //const datos = await this.checkjwt(req)
           // console.log('dato->',datos)
            //console.log('cli: ',req.query.idcli)
            req.body.pagoscli.forEach(e=>{
                //cambiar estado de los pedidos a 'PAGADO'
                //console.log('e:',e)
                Pedidos.update( {estado:'PAGANDO'},{where:{idCliente:e}} )
            })
            res.status(200).json({msg:'ok'})
        })
        */
        this.router.get('/cerrar/:idMesa',this.checkjwt,async(req,res)=>{
            await Mesas.update({estado:'LIBRE'},{where:{idMesa:req.params.idMesa}})
            await Pedidos.destroy({where:{idMesa:req.params.idMesa}})
            await Comensales.destroy({where:{idMesa:req.params.idMesa}})
            res.status(200).json({msg:'ok'});
        })
        this.router.get('/llamarmozo/:idMesa',this.checkjwt,async(req,res,next)=>{
            // No se hace nada...
            res.status(200).json({msg:'ok'})
        })
        this.router.get('/estado/:idMesa',async(req,res)=>{
            try {
                let pedidos = await Pedidos.findAll({
                    include:[{
                        model:Platos,
                        required:true,
                        attributes:['nombre','precio']
                    },{
                        model:Comensales,
                        required:true,
                        attributes:['nombre']
                    }],
                    where:{idMesa:req.params.idMesa}
                })
                console.log('respondiendo->pedidos:',JSON.stringify(pedidos))
                res.status(200).json({pedidos})
            } catch (error) {
                res.statusMessage=error.msj;
                return res.status(error.code||500).send();
            }
        })
    }
}

module.exports = MesasRoutes;
const {Router} = require('express');
const {Pedidos,Comensales,Platos,start, Mesas} = require('../model/db');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

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
                    await Comensales.update({idMesa:req.params.idMesa},{where:{idCliente:req.body.idCliente}});
                    await Mesas.update({estado:'OCUPADA'},{where:{idMesa:req.params.idMesa}})
                    return res.status(200).json({token:this.crearToken(req.params.idMesa,req.body.idCliente)})
                }else{
                    return res.status(404).send()
                }
            } catch (error) {
                return res.status(500).send()
            }
        })        
        this.router.post('/ordenar/:idMesa',this.checkjwt ,async(req,res)=>{
            //let peds=[]
            //console.log('body',req.body)
            //const datos = await this.checkjwt(req,res);
            //console.log('datos',this.datos)
            req.body.ordenes.forEach(e => {
                Pedidos.create({
                //peds.push({
                    idMesa:this.datos.idMesa,
                    idCliente:this.datos.idCliente,
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
        this.router.post('/pagar/:idMesa',this.checkjwt,async(req,res)=>{
            //console.log('garping')
            //const datos = await this.checkjwt(req)
           // console.log('dato->',datos)
            //console.log('cli: ',req.query.idcli)
            req.body.pagoscli.forEach(e=>{
                //cambiar estado de los pedidos a 'PAGADO'
                //console.log('e:',e)
                Pedidos.update( {estado:'PAGANDO'},{where:{idCliente:e}} )
            })
            res.status(200).json({msg:'ok'})})
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
                res.status(200).json({pedidos})
            } catch (error) {
                res.statusMessage=error.msj;
                return res.status(error.code||500).send();
            }
        })
    }
}

module.exports = MesasRoutes;
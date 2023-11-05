const {Router} = require('express');
const {Pedidos,Comensales,Platos,start, Mesas} = require('../model/db');
const qrcode = require('qrcode');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {Op, Sequelize} = require('sequelize');
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
        this.router.get('/registrarse/:idMesa/:idCliente/:hash',async(req,res)=>{
            try {
                if (bcrypt.compareSync(process.env.KEY_QR+req.params.idMesa,atob(req.params.hash))){
                    await Comensales.update({idMesa:req.params.idMesa,estado:'SENTADO'},{where:{idCliente:req.params.idCliente}});
                    await Mesas.update({estado:'OCUPADA'},{where:{idMesa:req.params.idMesa}})
                    return res.status(200).json({token:this.crearToken(req.params.idMesa,req.params.idCliente)})
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
            try {
                await Pedidos.update({estado:'PAGANDO'},{where:{idCliente:req.params.idCliente}})    
                res.status(200).json({rta:'OK'})                
            } catch (error) {                
                return res.status(500).send()
            }
        })
        this.router.get('/consumos/:idCliente',this.checkjwt,async(req,res)=>{            
            const pedidos = await Pedidos.findAll({
                include:[{
                    model: Platos,
                    required: true,
                    attributes:['idPlato','nombre','precio']
                }],
                attributes:['idPedido','cantidad'],
                where:{
                    [Op.and]:[
                        {idCliente:req.params.idCliente},
                        {estado:{[Op.like]:'ENTREGADO'}}
                    ]
                }});
            res.status(200).json({consumo:pedidos})
        })
        this.router.post('/pagar/invitados/:idCliente',this.checkjwt, async(req,res)=>{
            try {
                let invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})
                //console.log('body.pagoscli: ',JSON.stringify(req.body.pagoscli))
                //console.log('invitador: ',JSON.stringify(invitador))
                let amigos=[]
                //await Pedidos.update({estado:'PAGANDO'},{where:{idPedido:req.params.idCliente}});
                for await (let e of req.body.pagoscli){
                    //Pedidos.update( {estado:'PAGANDO'},{where:{[Op.and]:[{idCliente:e},{estado:'ENTREGADO'}]}} )
                    amigos.push(await Comensales.findOne({attributes:['idFcb'],where:{idCliente:e}}))
                }
                //console.log("amigos-> ",JSON.stringify(amigos))    
                let config = {
                    headers:{
                        'Content-Type':'application/json',
                        Authorization:'key='+process.env.FCBKEY
                    }
                }
                let body = {
                    registration_ids:amigos.map(e=>e.idFcb),
                    notification: {
                        title:'Pago de la cuenta',
                        body:`El cliente ${invitador.dataValues.nombre} te ha invitado y pagará lo que has consumido`
                    },
                    direct_boot_ok: true,
                    data:{
                        action: "invite"
                    }
                }
                const rta = await axios.post(process.env.FCB_URL,body,config);
                /*console.log("rta.status->",rta.status)
                console.log("rta.statusText->",rta.statusText)
                console.log("rta.config.data->",rta.config.data)*/
                res.status(200).json({msg:rta.statusText})                
            } catch (error) {
                //console.log('error-> ',error)
                return res.status(500).send()                
            }
        })
        this.router.get('/pagar/dividido/:idMesa/:idCliente/:rtaInvtacion',this.checkjwt,async(req,res)=>{
            let amigos =[];
            let config ={};
            let body={};
            let rta;
            let sentados;
            let invitador;            
            console.log("pago dividido ->cli: "+req.params.idCliente+" accion-> "+req.params.rtaInvtacion)
            switch (req.params.rtaInvtacion){
                case "start":
                    await Comensales.update({estado:'PAGODIVIDIDO'},{where:{idCliente:req.params.idCliente}});
                    
                    let total = await Pedidos.findAll({
                        include:[{
                            model:Platos,
                            required:true,
                            attributes:['precio']
                        }],
                        attributes:['idPedido','cantidad'],
                        //where:{idCliente:req.params.idCliente}
                        where:{idMesa:req.params.idMesa}
                    })                    
                    let sum = total.reduce( (acu,elem)=>{return acu+(0+elem.cantidad) * (0+elem.Plato.precio)},0)

                    sentados = await Comensales.findAll({
                        where:{
                            [Op.and]:[
                                {idMesa:req.params.idMesa},
                                {estado:{[Op.like]:'SENTADO'}},
                                {[Op.not]:{idCliente:req.params.idCliente}}
                            ]
                        }
                    })
                    invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})

                    for await (let e of sentados){
                        amigos.push((await Comensales.findOne({attributes:['idFcb'],where:{idCliente:e.dataValues.idCliente}})).dataValues.idFcb)
                    }

                    config = {
                        headers:{
                            'Content-Type':'application/json',
                            Authorization:'key='+process.env.FCBKEY
                        }
                    }                    
                    body = {
                        registration_ids:amigos,
                        notification: {
                            title:'Pago de la cuenta',
                            body:`El cliente ${invitador.dataValues.nombre} ha propuesto dividir lo gastado en la mesa en partes iguales. El total gastado en la mesa es de $${sum} repartido entre ${sentados.length+1} comensales. A cada comensal le corresponde abonar $${sum/(sentados.length+1)}`,
                        },
                        direct_boot_ok: true,
                        data:{
                            action: "share"
                        }
                    }                    
                    rta = await axios.post(process.env.FCB_URL,body,config);

                    res.status(200).json({msg:rta.statusText}) 
                break;
                case "si":
                    await Comensales.update({estado:'PAGODIVIDIDO'},{where:{idCliente:req.params.idCliente}});
                    console.log("pago dividido->si ->cli: "+req.params.idCliente+" accion-> "+req.params.rtaInvtacion)
                    invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})
                    sentados = await Comensales.findAll({
                        where:{
                            [Op.and]:[
                                {idMesa:req.params.idMesa},
                                {estado:{[Op.like]:'SENTADO'}},
                                {[Op.not]:{idCliente:req.params.idCliente}}
                            ]
                        }
                    })
                    for await (let e of sentados){
                        amigos.push((await Comensales.findOne({attributes:['idFcb'],where:{idCliente:e.dataValues.idCliente}})).dataValues.idFcb)
                    }
                    config = {
                        headers:{
                            'Content-Type':'application/json',
                            Authorization:'key='+process.env.FCBKEY
                        }
                    }
                    if(sentados.length==0){                
                        //ERA EL ULTIMO EN ACEPTAR => ACTUALIZAR
                        //(se pagaran todos los pedidos de la mesa)
                        await Pedidos.update({estado:'PAGANDO'},{where:{idMesa:req.params.idMesa}})
                        // Notificar que todos aceptaron:                                        
                        body = {
                            registration_ids:amigos,
                            notification: {
                                title:'Pedido de cuenta',
                                body:'Todos los comensales de la mesa han acordado en pagar el total gastado en la mesa en forma dividida'
                            },
                            direct_boot_ok: true,
                            data:{
                                action: "invite"
                            }
                        }
                    }else{                                    
                        body = {
                            registration_ids:amigos,
                            notification: {
                                title:'Pedido de cuenta',
                                body:`El usuario ${invitador.dataValues.nombre} ha aceptado pagar el total gastado en la mesa en forma dividida`
                            },
                            direct_boot_ok: true,
                            data:{
                                action: "invite"
                            }
                        }
                    }                  
                    rta = await axios.post(process.env.FCB_URL,body,config);
                    res.status(200).json({msg:rta.statusText}) 
                break;
                case "no":
                    invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})
                    sentados = await Comensales.findAll({
                        where:{
                            [Op.and]:[
                                {idMesa:req.params.idMesa},
                                {estado:{ [Op.or]:{[Op.like]:'SENTADO',[Op.like]:'PAGODIVIDIDO'}}},
                                {[Op.not]:{idCliente:req.params.idCliente}}
                            ]
                        }
                    })
                    for await (let e of sentados){
                        amigos.push((await Comensales.findOne({attributes:['idFcb'],where:{idCliente:e.dataValues.idCliente}})).dataValues.idFcb)
                        await Comensales.update( {estado:'SENTADO'}, {where:{estado:{[Op.like]:'PAGODIVIDIDO'}}} );
                    }
                    config = {
                        headers:{
                            'Content-Type':'application/json',
                            Authorization:'key='+process.env.FCBKEY
                        }
                    }
                    body = {
                        registration_ids:amigos,
                        notification: {
                            title:'Pedido de cuenta',
                            body:`El usuario ${invitador.dataValues.nombre} No ha aceptado pagar el total gastado en la mesa en forma dividida`
                        },
                        direct_boot_ok: true,
                        data:{
                            action: "invite"
                        }
                    }
                    rta = await axios.post(process.env.FCB_URL,body,config);
                    res.status(200).json({msg:rta.statusText}) 
                break;
            }
            /*await Comensales.update({estado:'PAGODIVIDIDO'},{where:{idCliente:req.params.idCliente}})
            let sentados = await Comensales.findAll({
                where:{
                    [Op.and]:[
                        {idMesa:req.params.idCMesa},
                        {estado:{[Op.like]:'SENTADO'}}
                    ]
                }
            })
            let aceptantes = await Comensales.findAll({
                where:{
                    [Op.and]:[
                        {idMesa:req.params.idCMesa},
                        {estado:{[Op.like]:'PAGODIVIDIDO'}}
                    ]
                }
            })
            if(sentados.length==0){                
                //ERA EL ULTIMO EN ACEPTAR => ACTUALIZAR
                //(se pagaran todos los pedidos de la mesa)
                await Pedidos.update({estado:'PAGANDO'},{where:{idMesa:req.params.idMesa}})
                // Notificar que todos aceptaron:                
                let config = {
                    headers:{
                        'Content-Type':'application/json',
                        Authorization:'key='+process.env.FCBKEY
                    }
                }
                let body = {
                    registration_ids:aceptantes.map(e=>e.idFcb),
                    notification: {
                        title:'Pedido de cuenta',
                        body:'Todos los comensales de la mesa han acordado en pagar el total gastado en la mesa en forma dividida'
                    },
                    direct_boot_ok: true
                }
                const rta = await axios.post(process.env.FCB_URL,body,config);
            }

            if(aceptantes.length==1){
                //ERA EL PRIMERO => MANDAR LAS NOTIFICACIONES A LOS DEMAS
                let invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})
                let config = {
                    headers:{
                        'Content-Type':'application/json',
                        Authorization:'key='+process.env.FCBKEY
                    }
                }
                let body = {
                    registration_ids:sentados.map(e=>e.idFcb),
                    notification: {
                        title:'Pedido de cuenta',
                        body:`El cliente ${invitador.dataValues.nombre} ha propuesto dividir el total de lo consumido en la mesa entre todos. (aceptar/rechazar?)`,
                        //click_action:""
                    },
                    direct_boot_ok: true
                }
                const rta = await axios.post(process.env.FCB_URL,body,config);
            }else{
                //ES UNO DE LOS QUE ACEPTAlet invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})
                let config = {
                    headers:{
                        'Content-Type':'application/json',
                        Authorization:'key='+process.env.FCBKEY
                    }
                }
                let body = {
                    registration_ids:aceptantes.map(e=>(e.idFcb && e.idCliente!=req.params.idCliente)),
                    notification: {
                        title:'Pedido de cuenta',
                        body:`El cliente ${invitador} ha aceptado dividir el total de lo consumido en la mesa entre todos`
                    },
                    direct_boot_ok: true
                }
                const rta = await axios.post(process.env.FCB_URL,body,config);
            }*/
            /*let sentados = await Comensales.findAll({
                where:{
                    [Op.and]:[
                        {idMesa:req.params.idMesa},
                        {estado:{[Op.like]:'SENTADO'}}
                    ]
                }
            })*/
            //let invitador = await Comensales.findOne({attributes:['nombre'],where:{idCliente:req.params.idCliente}})
                //console.log('body.pagoscli: ',JSON.stringify(req.body.pagoscli))
                //console.log('invitador: ',JSON.stringify(invitador))
            //let amigos=[]
                //await Pedidos.update({estado:'PAGANDO'},{where:{idPedido:req.params.idCliente}});
           /*for await (let e of sentados){
                    //Pedidos.update( {estado:'PAGANDO'},{where:{[Op.and]:[{idCliente:e},{estado:'ENTREGADO'}]}} )
                amigos.push((await Comensales.findOne({attributes:['idFcb'],where:{idCliente:e.dataValues.idCliente}})).dataValues.idFcb)
            }
            console.log("amigos",amigos)
            let config = {
                headers:{
                    'Content-Type':'application/json',
                    Authorization:'key='+process.env.FCBKEY
                }
            }
            let body = {
                registration_ids:amigos,//amigos.map(e=>e.idFcb),
                notification: {
                    title:'Pago de la cuenta',
                    body:`El cliente ${invitador.dataValues.nombre} ha propuesto dividir Todo lo consummidoinvitado y pagará lo que has consumido`,
                },
                direct_boot_ok: true,
                data:{
                    action: "share"
                }
            }
            
            const rta = await axios.post(process.env.FCB_URL,body,config);
            console.log("rta.status->",rta.status)
            console.log("rta.statusText->",rta.statusText)
            res.status(200).json({msg:rta.statusText})    */ 
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
        this.router.get('/entregarpedidos/:idCli',async (req,res)=>{
            try {
                await Pedidos.update({estado:'ENTREGADO'},{where:{idCliente:req.params.idCli}})
                return res.status(200).json({rta:'OK'})
            } catch (error) {
                return res.status(500).send()
            }
        })
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
                let comensales=[]
                let compas = await Comensales.findAll({
                    attributes:['idCliente','nombre'],
                    where:{idMesa:req.params.idMesa}
                }) 
                for await (let cli of compas){
                    let peds = await Pedidos.findAll({
                        include:[{
                            model: Platos,
                            required: true,
                            attributes:['nombre','precio']
                        }],
                        where:{idCliente:cli.idCliente}
                    });
                    comensales.push({idCliente:cli.idCliente,nombre:cli.nombre,Pedidos:peds})
                }   
                return res.status(200).json({comensales:comensales}) 
            } catch (error) {
                res.statusMessage=error.msj;
                return res.status(error.code||500).send();
            }
        })
        this.router.get('/compas/:idMesa',async(req,res)=>{
            try {
                let comensales=[]
                let compas = await Comensales.findAll({
                    attributes:['idCliente','nombre'],
                    where:{idMesa:req.params.idMesa}
                }) 
                for await (let cli of compas){
                    let peds = await Pedidos.findAll({
                        include:[{
                            model: Platos,
                            required: true,
                            attributes:['nombre','precio']
                        }],
                        where:{idCliente:cli.idCliente}
                    });
                    if(peds.filter(e => e.estado=="ENTREGADO").length !=0){
                        comensales.push({idCliente:cli.idCliente,nombre:cli.nombre,Pedidos:peds.filter(e => e.estado=="ENTREGADO")})
                    }
                }   
                return res.status(200).json({comensales:comensales})          
            } catch (error) {
                console.log("error->",error)
                res.statusMessage=error.msj;
                return res.status(error.code||500).send();                
            }
        })
    }
}

module.exports = MesasRoutes;
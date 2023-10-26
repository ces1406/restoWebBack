const {Router} = require('express');
const {Comensales,start} = require('../model/db');

class UsersRoutes{
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    routes(){
        this.router.get('/:nombre/:deviceid',async(req,res,next)=>{
            try {
                let cabecera = {method:'POST'}
                cabecera.headers['Content-Type'] = 'application/json'
                cabecera.headers['Authorizaton'] = process.env.FCBKEY
                cabecera.body=JSON.stringify({
                    registration_ids:[req.params.deviceid],
                    notification: [{title:'un titulo',body:'el body es este'}],
                    direct_boot_ok: true
                })
                let url = 'https://fcm.googleapis.com/fcm/send'
                const cli = await Comensales.create({nombre:req.params.nombre});

                const rta = fetch(url,cabecera)
                //res.status(200).send({idCliente:cli.dataValues.idCliente, datos:JSON.stringify(rta)})
                res.status(200).send({resp:JSON.stringify(rta)})
            } catch (error) {
                console.log('error-->',JSON.stringify(error))
                res.statusMessage=error.msj;
                return res.status(error.code||500).send({rta:JSON.stringify(error.mesagge)});
            }
        })
        this.router.get('/dividepay/:idcli', async(req,res)=>{
            //fetch
        })
    }
}

module.exports = UsersRoutes;
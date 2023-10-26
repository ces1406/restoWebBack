const {Router} = require('express');
const {Comensales,start} = require('../model/db');
const axios = require('axios')

class UsersRoutes{
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    routes(){
        this.router.get('/:nombre/:deviceid',async(req,res,next)=>{
            try {
                let config = {
                    headers:{
                        'Content-Type':'application/json',
                        Authorization:'key='+process.env.FCBKEY
                    }
                }
                //cabecera.headers['Content-Type'] = 'application/json'
                //cabecera.headers['Authorizaton'] = process.env.FCBKEY
                let body = {
                    registration_ids:[req.params.deviceid],
                    notification: {title:'un titulo',body:'el body es este'},
                    direct_boot_ok: true
                }
                let url = 'https://fcm.googleapis.com/fcm/send'
                const cli = await Comensales.create({nombre:req.params.nombre});
                const rta = await axios.post(url,body,config)
                //console.log('rta.data--->',rta.data)
                //res.status(200).json({resp:rta.data})
                res.status(200).send({idCliente:cli.dataValues.idCliente})
            } catch (error) {
                //console.log('error-->',JSON.stringify(error))
                res.statusMessage=error.msj;
                //console.log('error.msg-->',error.mesagge)
                return res.status(error.code||500).send({rta:JSON.stringify(error.mesagge)});
            }
        })
        this.router.get('/dividepay/:idcli', async(req,res)=>{
            //fetch
        })
    }
}

module.exports = UsersRoutes;
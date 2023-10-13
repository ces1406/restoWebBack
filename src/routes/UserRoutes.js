const {Router} = require('express');
const {Comensales,start} = require('../model/db');

class UsersRoutes{
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    routes(){
        this.router.get('/:nombre',async(req,res,next)=>{
            try {
                const cli = await Comensales.create({nombre:req.params.nombre});
                res.status(200).send({idCliente:cli.dataValues.idCliente})
            } catch (error) {
                res.statusMessage=error.msj;
                return res.status(error.code||500).send();
            }
        })
    }
}

module.exports = UsersRoutes;

const {Router} = require('express');
const {Pedidos,Platos,start} = require('../model/db');

class MesasRoutes{
    constructor(){
        this.router = Router();
        start();
        this.routes();
    }
    routes(){
        this.router.get('/:idMesa',async(req,res,next)=>{
            try {
                //let rta = await Pedidos.findAll({where:{idMesa:req.params.idMesa}});
                console.log('por mesa->',req.params.idMesa);
                let rta = await Pedidos.findAll({
                    include:[{
                        model:Platos,
                        required:true,
                        attributes:['nombre','precio']
                    }],
                    where:{idMesa:req.params.idMesa}
                })
                
                //let rta = await Pedidos.findAll({ where:{idMesa:req.params.idMesa} })
                console.log('rta->',rta);
                res.status(200).json({rta})
            } catch (error) {
                res.statusMessage=error.msj;
                console.log('error->',error)
                return res.status(error.code||500).send();
            }
        })
    }
}

module.exports = MesasRoutes;
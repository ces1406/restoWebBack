const express = require("express");
const PlatosRoutes = require('./routes/PlatosRoutes')

class Aplicacion {
    constructor(){
        this.app = express();
        this.setPort();
        this.enrutar();
    }
    setPort = ()=>{
        this.app.set('port',process.env.PORT||5000);
    }
    enrutar = ()=>{
        const rutasPlatos = new PlatosRoutes();
        this.app.use('/platos',rutasPlatos.router);
    }
    startServer = ()=>{
        this.app.listen(this.app.get('port'),()=>{console.log('Escuchando en el puerto->',this.app.get('port'))})
    }
}

module.exports = Aplicacion
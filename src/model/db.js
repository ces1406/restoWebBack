const {Sequelize, Datatypes} = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_NAME,process.env.DATABASE_USER,process.env.DATABASE_PASS,{
    host: process.env.DATABASE_HOSTNAME,
    dialect: 'mysql',
    timezone:'America/Argentina/Buenos_Aires',
    dialectOptions:{
        timezone:'local'
    }
});

const Platos = sequelize.define('Plato',{
    idPlato :{type:Datatypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    nombre:{type:Datatypes.STRING(40),allowNull:false},
    descripcion:{type:Datatypes.STRING(250),allowNull:true},
    imagen:{type:Datatypes.STRING(100)},
    precio:{type:Datatypes.DECIMAL(8,2),allowNull:false},
    puntaje:{type:Datatypes.INTEGER},
    categoria:{type:Datatypes.STRING(50)},
    ingredientes:{type:Datatypes.STRING(150)},
    infoNutri:{type:Datatypes.STRING(150)},
    disponible:{type:Datatypes.BOOLEAN}
},{timestamps:false, tableName:'platos'});

const Mesas = sequelize.define('Mesa',{
    idMesa:{type:Datatypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    capacidad:{type:Datatypes.INTEGER,allowNull:false}
},{timestamps:false, tableName:'mesas'});

const Comensales = sequelize.define('Comensal',{
    idCliente :{type:Datatypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    nombre:{type:Datatypes.STRING(40),allowNull:false},
    idMesa:{type:Datatypes.INTEGER}
},{timestamps:false, tableName:'comensales'});

const Pedidos = sequelize.define('Pedido',{
    idPedido :{type:Datatypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    idMesa:{type:Datatypes.INTEGER},
    idCliente:{type:Datatypes.INTEGER},
    estado:{type:Datatypes.STRING(50)},
    cancelable:{type:Datatypes.BOOLEAN},
    horaPedido:{type:Datatypes.DATE}
},{timestamps:false, tableName:'pedidos'});

const start = async()=>{
    try {
        await sequelize.authenticate();
    } catch (err) {}
}

module.exports ={start,Platos,Mesas,Comensales,Pedidos}
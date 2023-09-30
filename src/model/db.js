const {Sequelize, DataTypes} = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_NAME,process.env.DATABASE_USER,process.env.DATABASE_PASS,{
    host: process.env.DATABASE_HOSTNAME,
    dialect: 'mysql',
    timezone:'America/Argentina/Buenos_Aires',
    dialectOptions:{
        timezone:'local'
    }
});

const Platos = sequelize.define('Plato',{
    idPlato :{type:DataTypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    nombre:{type:DataTypes.STRING(40),allowNull:false},
    descripcion:{type:DataTypes.STRING(250),allowNull:true},
    imagen:{type:DataTypes.STRING(100)},
    precio:{type:DataTypes.DECIMAL(8,2),allowNull:false},
    puntaje:{type:DataTypes.INTEGER},
    categoria:{type:DataTypes.STRING(50)},
    ingredientes:{type:DataTypes.STRING(150)},
    infoNutri:{type:DataTypes.STRING(150)},
    disponible:{type:DataTypes.BOOLEAN}
},{timestamps:false, tableName:'platos'});

const Mesas = sequelize.define('Mesa',{
    idMesa:{type:DataTypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    capacidad:{type:DataTypes.INTEGER,allowNull:false},
    estado:{type:DataTypes.STRING(12)}
},{timestamps:false, tableName:'mesas'});

const Comensales = sequelize.define('Comensal',{
    idCliente :{type:DataTypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    nombre:{type:DataTypes.STRING(40),allowNull:false}
},{timestamps:false, tableName:'comensales'});

const Pedidos = sequelize.define('Pedido',{
    idPedido :{type:DataTypes.INTEGER, allowNull:false, autoIncrement:true, unique:true,primaryKey:true},
    estado:{type:DataTypes.STRING(50)},
    cantidad:{type:DataTypes.INTEGER, allowNull:false},
    cancelable:{type:DataTypes.BOOLEAN},
    horaPedido:{type:DataTypes.DATE}
},{timestamps:false, tableName:'pedidos'});

const start = async()=>{
    try {
        Comensales.hasOne(Mesas,{foreignKey:'idMesa'})
        Mesas.belongsToMany(Comensales,{foreignKey:'idMesa'})
        Pedidos.hasOne(Comensales,{foreignKey:'idCliente'})
        Comensales.belongsToMany(Pedidos,{foreignKey:'idCliente'})
        Pedidos.hasOne(Mesas,{foreignKey:'idMesa'})
        Mesas.belongsToMany(Pedidos,{foreignKey:'idMesa'})
        Pedidos.hasOne(Platos,{foreignKey:'idPlato'})
        Platos.belongsToMany(Pedidos,{foreignKey:'idPlato'})
        await sequelize.authenticate();
    } catch (err) {}
}

module.exports ={start,Platos,Mesas,Comensales,Pedidos}
# DROP DATABASE IF EXISTS restoBack;
CREATE DATABASE restoBack;
USE restoBack;

CREATE TABLE platos(
    idPlato INT AUTO_INCREMENT PRIMARY KEY,
    nombre NVARCHAR(40),
    descripcion NVARCHAR(250),
    imagen NVARCHAR(100),
    precio DECIMAL(8,2),
    puntaje INT,
    categoria NVARCHAR(50),
    ingredientes NVARCHAR(150),
    infoNutri NVARCHAR(150),
    disponible BOOLEAN
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

CREATE TABLE mesas(
    idMesa INT AUTO_INCREMENT PRIMARY KEY,
    capacidad INT
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE comensales(
    idCliente INT AUTO_INCREMENT PRIMARY KEY,
    nombre NVARCHAR(40),
    idMesa INT
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

CREATE TABLE pedidos(
    idPedido INT AUTO_INCREMENT PRIMARY KEY,
    idMesa INT,
    idCliente INT,
    estado NVARCHAR(50),
    cancelable BOOLEAN,
    horaPedido DATETIME
)ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_spanish_ci;

insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Papas fritas','porción generosa de papas fritas crocantes en bastones','https://i.ibb.co/Lvyb4G0/papas-fritas.jpg',1100.5,0,'plato','papas,sal','calorias:300,grasas:120',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Milanesa napolitana con papas fritas','milanesa napolitana con una porción generosa de papas fritas en bastones','https://i.ibb.co/7rFZ9Dw/napo-papas.webp',2195.5,0,'plato principal','carne,salsa de tomate,papas,sal','calorias:600,grasas:200',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Milanesa con papas fritas','milanesa de ternera acompañada de una porción generosa de papas fritas crocantes en bastones','https://i.ibb.co/QX53x1Y/mila-papas2.jpg',1100.5,0,'plato principal','carne,papas,sal','calorias:300,grasas:120',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Milanesa a caballo con fritas','milanesa de ternera con huevos fritos acompañada de una porción generosa de papas fritas en bastones','https://i.ibb.co/ZXc49Yw/mila-papas-huevos.jpg',1100.5,0,'plato','papas,sal','calorias:300,grasas:120',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Cerveza en lata','cerveza artesanal IPA marca Blest en lata de 473ml','https://i.ibb.co/6R68Ggz/cerv5.webp',810.0,0,'bebida alcoholica','cebada,malta','calorias:375',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Cerveza en lata','cerveza artesanal tipo SCOTCH marca Blest en lata de 473ml','https://i.ibb.co/JqZ5cNq/cerv4.webp',810.0,0,'bebida alcoholica','cebada,malta','calorias:375',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Cerveza en lata','cerveza artesanal con pulpa de lima y maracuyá en lata de 473ml','https://i.ibb.co/SrmLQ0m/cerv3.webp',810.0,0,'bebida alcoholica','cebada,malta,lima,maracuyá','calorias:305',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Pizza calabresa','Pizza a la calabresa tamaño grande','https://i.ibb.co/zVWNNH8/pizza-calabresa.webp',3500.0,0,'plato compartido','harina,muzzarella,longaniza','calorias:3300,grasas:1420',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Pizza de muzzarella','Pizza de muzzarella al molde tamaño grande','https://i.ibb.co/0r42MZs/pizza-molde.jpg',3000.5,0,'plato compartido','harina,muzzarella,salsa de tomate','calorias:2800,grasas:1000',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Cerveza en lata','cerveza rubia marca Andes en lata de 473ml','https://i.ibb.co/j6pQ2dQ/cerv1.webp',810.0,0,'bebida alcoholica','cebada,malta,lima,maracuyá','calorias:305',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Pepsi','gaseosa pepsi en lata de 473ml','https://i.ibb.co/HHc8tJV/pepsi.webp',380.0,0,'bebida no alcoholica','agua carbonatada,azucar,edulcorantes','calorias:435',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Jugo de durazno','jugo de durazno en lata de 500ml','https://i.ibb.co/zNtjxW9/jugo-durazno.webp',480.0,0,'bebida no alcoholica','azucar,jugo de durazno,lima','calorias:100',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Flan','porción de flan casero con cubierta de caramelo','https://i.ibb.co/QKvmznn/flan.jpg',580.0,0,'postre individual','leche,azucar,huevo','calorias:200',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Helado','porción de 3 bochas de helado','https://i.ibb.co/QKvmznn/flan.jpg',480.0,0,'postre individual','azucar,leche,crema de leche','calorias:315',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Panqueques','porción de 2 panqueques rellenos de dulce de leche','https://i.ibb.co/72B5HHG/panqueques.jpg',420.0,0,'postre individual','harina,azucar,leche,dulce de leche','calorias:315',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Sopa inglesa','porción individual de torta de masa suave mojada en vino dulce con trozos de frutas y cubierta de crema','https://i.ibb.co/mFqFR8B/sopa-inglesa.jpg',680.0,0,'postre individual','harina,azucar,leche,crema de leche','calorias:535',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Tortilla de papas','porción individual de tortilla de papas','https://i.ibb.co/JdR97jL/tortilla-papas.jpg',780.75,0,'plato individual','papas,huevo,queso,aceite de oliva','calorias:315',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Tallarines verdes','plato de tallarines verdes hechos al estilo peruano','https://i.ibb.co/t8SHG95/tallarines-verdes-peruanos.jpg',848.0,0,'plato idividual','harina,sal,aceite,queso','calorias:315',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Tallarines con albondigas','plato de tallarines con albondigas de carne cubiertos de salsa roja','https://i.ibb.co/S7NzFmP/tallarines-albondigas.jpg',848.0,0,'plato idividual','harina,sal,aceite,queso','calorias:315',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Sorrentinos de jamon y queso','plato de 6 sorrentinos tamaño grande rellenos con jamón y queso cubiertos con salsa roja','https://i.ibb.co/ctST70k/sorrentinos-jamon-y-queso.jpg',2140.0,0,'plato individual','harina,jamon,queso,salsa de tomates','calorias:231',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Sorrentinos 4 quesos','plato de 6 sorrentinos tamaño grande rellenos con queso parmesano, roquefort, muzzarella y reggianito cubiertos con salsa roja','https://i.ibb.co/Kydbsby/sorrentinos-4quesos.jpg',2140.0,0,'plato individual','harina,jamon,queso,salsa de tomates','calorias:223',true);
insert into platos (nombre,descripcion,imagen,precio,puntaje,categoria,ingredientes,infoNutri,disponible) values ('Sorrentinos de calabaza','plato de 6 sorrentinos tamaño grande rellenos con calabaza y muzzrella cubiertos con salsa roja','https://i.ibb.co/y01g21R/sorrentinos-calabaza-queso.jpg',2140.0,0,'plato individual','harina,zapallo,queso,salsa de tomates','calorias:85',true);

select * from platos;
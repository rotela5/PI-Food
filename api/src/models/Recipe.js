const { DataTypes } = require('sequelize');
// Exportamos una funcion que define el modelo
// Luego le injectamos la conexion a sequelize.
module.exports = (sequelize) => {
  // defino el modelo
  sequelize.define('recipe', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resumenDelPlato:{
      type: DataTypes.STRING,
      allowNull:false
    },
    nivelComidaSaludable:{
      type: DataTypes.STRING,
      allowNull:false,
    },
    pasoApaso:{
      type: DataTypes.STRING,
      allowNull:false,
    },
    createdFood:{
      type:DataTypes.BOOLEAN,
      allowNull:false,
      defaultValue:true,
    },

  });
};


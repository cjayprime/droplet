'use strict';
import {Audio, Category, Drop, Like, Listen} from '..';

const models = [Category, Audio, Drop, Like, Listen];
const categories = [
  {name: 'convo', color: 'red'},
  {name: 'music', color: 'green'},
  {name: 'comedy', color: 'blue'},
  {name: 'asmr', color: 'yellow'},
];
const migration = {
  up: async (queryInterface, Sequelize) => {
    Category.hasMany(Drop, {
      as: 'caterrr',
      foreignKey: 'category_id',
      allowNull: false,
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
    Drop.belongsTo(Category);
    
    Audio.hasOne(Drop, {
      as: 'qskqks',
      foreignKey: 'audio_id',
      allowNull: false,
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
    Drop.belongsTo(Audio);
    
    Drop.hasMany(Like, {
      as: 'qksoqs',
      foreignKey: 'drop_id',
      allowNull: false,
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
    Like.belongsTo(Drop);
    
    Drop.hasMany(Listen, {
      as: 'asqsoks',
      foreignKey: 'drop_id',
      allowNull: false,
      onDelete: 'RESTRICT',
      onUpdate: 'RESTRICT',
    });
    Listen.belongsTo(Drop);

    await Promise.all(models.map(async (model) => {
      return await queryInterface.createTable(model.getTableName(), model.rawAttributes);
    }));

    await Promise.all(categories.map(async (category) => {
      return await Category.create({
        name: category.name,
        color: category.color,
        status: '1',
        date: Sequelize.NOW,
      });
    }));
  },
  down: async (queryInterface/*, Sequelize*/) => {
    await Promise.all(models.map(async (model) => {
      await queryInterface.deleteTable(model.getTableName());
    }));
  }
};

export default migration;

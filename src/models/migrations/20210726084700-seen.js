import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface/*, Sequelize*/) => {
    await queryInterface.createTable('seen', {
      seen_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
        unique: 'user_marks_a_drop_as_seen_once',
      },
      drop_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'drop', key: 'drop_id' },
        unique: 'user_marks_a_drop_as_seen_once',
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('seen', {
      fields: ['user_id', 'drop_id'],
      type: 'unique',
      name: 'user_marks_a_drop_as_seen_once',
    });
  },
  down: async (queryInterface/*, Sequelize*/) => {
    return await queryInterface.deleteTable('seen');
  }
};

export default migration;

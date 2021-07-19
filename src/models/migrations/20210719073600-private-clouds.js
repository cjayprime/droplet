import { DataTypes } from '../base';

const migration = {
  up: async (queryInterface) => {
    await queryInterface.addColumn(
      'sub_cloud',
      'user_id',
      {
        type: DataTypes.BIGINT,
        allowNull: true,
        after: 'cloud_id',
        references: { model: 'user', key: 'user_id' },
      },
    );
    await queryInterface.createTable('group', {
      group_id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      sub_cloud_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'sub_cloud', key: 'sub_cloud_id' },
        unique: 'one_user_and_sub_cloud_combination_per_group',
      },
      user_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: { model: 'user', key: 'user_id' },
        unique: 'one_user_and_sub_cloud_combination_per_group',
      },
      status: {
        type: DataTypes.ENUM('0', '1'),
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addConstraint('group', {
      fields: ['sub_cloud_id', 'user_id'],
      type: 'unique',
      name: 'one_user_and_sub_cloud_combination_per_group',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.query('UPDATE sub_cloud SET user_id = NULL');
    await queryInterface.removeConstraint('sub_cloud', 'sub_cloud_user_id_foreign_idx');
    await queryInterface.removeColumn('sub_cloud', 'user_id');
    await queryInterface.removeConstraint('group', 'one_user_and_sub_cloud_combination_per_group');
    await queryInterface.query('UPDATE group SET user_id = NULL');
    await queryInterface.dropTable('group');
  }
};

export default migration;

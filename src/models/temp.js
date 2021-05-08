import sequelize from './base';

const migrations = {
  up: async (/*queryInterface, Sequelize*/) => {
    // Change all columns to use SQL `user_id` instead of firestore user_id (called `uid` and stored in SQL with that name)
    const tables = ['like', 'listen', 'interaction', 'filter_usage', 'drop', 'audio'];
    await Promise.all(tables.map(
      async table => {
        try {
          return await sequelize.query(
            {
              query: 'UPDATE `' + table + '` INNER JOIN user ON `' + table + '`.`user_id` = `user`.`uid` SET `' + table + '`.`user_id` = `user`.`user_id`',
              values: [],
            }
          );
        } catch (e) {
          console.log('Unable to update in alter.js', table, e);
        }
      })
    );

    await Promise.all(tables.map(
      async table => {
        try {
          return await sequelize.query(
            {
              query: 'ALTER TABLE `' + table + '` MODIFY COLUMN user_id BIGINT NOT NULL',
              values: [],
            }
          );
        } catch (e) {
          console.log('Unable to alter in temp.js', table, e);
        }
      })
    );

    await Promise.all(tables.map(
      async table => {
        try {
          return await sequelize.query(
            {
              query: 'ALTER TABLE `' + table + '` ADD CONSTRAINT FOREIGN KEY(user_id) REFERENCES user(user_id)',
              values: [],
            }
          );
        } catch (e) {
          console.log('Unable to update', table, e);
        }
      })
    );


    await Promise.all(tables.map(
      async table => {
        try {
          return await sequelize.query(
            {
              query: 'DELETE FROM `' + table + '` WHERE user_id = 0',
              values: [],
            }
          );
        } catch (e) {
          console.log('Unable to update', table, e);
        }
      })
    );

    
      
    // await Promise.all(tables.map(
    //   async table => {
    //     try {
    //       await sequelize.query(
    //         {
    //           query: 'DELETE FROM `' + table + '` WHERE user_id = 0',
    //           values: [],
    //         }
    //       );
    //       await queryInterface.changeColumn(table, 'user_id', {
    //         type: DataTypes.BIGINT,
    //         allowNull: false,
    //       });
    //       await queryInterface.changeColumn(table, 'user_id', {
    //         // type: DataTypes.BIGINT,
    //         references: { model: 'user', key: 'user_id' },
    //       });
    //       console.log('Successfully updated: ', table);
    //     } catch (e) {
    //       Notify.info('An error occured while changing columns for ' + table);
    //       Notify.error(e);
    //     }
    //   })
    // );
  },
  down: async (queryInterface/*, Sequelize*/) => {
    queryInterface.deleteTable('user');
  }
};

export default migrations;

export {default as Audio} from './Audio';
export {default as Category} from './Category';
export {default as Drop} from './Drop';
export {default as Like} from './Like';
export {default as Listen} from './Listen';
export {default as Interaction} from './Interaction';

// Category.hasMany(Drop, {
//     foreignKey: 'category_id',
//     allowNull: false,
//     onDelete: 'RESTRICT',
//     onUpdate: 'RESTRICT',
//   });
//   Drop.belongsTo(Category);

//   Audio.hasOne(Drop, {
//     foreignKey: 'audio_id',
//     allowNull: false,
//     onDelete: 'RESTRICT',
//     onUpdate: 'RESTRICT',
//   });
//   Drop.belongsTo(Audio);

//   Drop.hasMany(Like, {
//     foreignKey: 'drop_id',
//     allowNull: false,
//     onDelete: 'RESTRICT',
//     onUpdate: 'RESTRICT',
//   });
//   Like.belongsTo(Drop);

//   Drop.hasMany(Listen, {
//     foreignKey: 'drop_id',
//     allowNull: false,
//     onDelete: 'RESTRICT',
//     onUpdate: 'RESTRICT',
//   });
//   Listen.belongsTo(Drop);

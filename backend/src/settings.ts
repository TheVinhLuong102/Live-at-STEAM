export default {
  SWITCH_ROOM_DELAY:
    (process.env.SWITCH_ROOM_DELAY &&
      parseInt(process.env.SWITCH_ROOM_DELAY)) ||
    60 * 5,
};

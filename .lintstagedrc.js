module.exports = {
  '*': [(files) => `nx format:write --files=${files.join(',')}`],
};

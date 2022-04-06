const { Controller } = require('egg');

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    await Promise.resolve();
    ctx.body = 'modernjs';
  }
}

module.exports = HomeController;

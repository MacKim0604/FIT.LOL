const { HelloService } = require('../services/hello.service');

class HelloController {
  constructor() {
    this.service = new HelloService();
  }

  getHello(_req, res) {
    const dto = this.service.getHello();
    res.status(200).json({ success: true, data: dto });
  }
}

module.exports = { HelloController };

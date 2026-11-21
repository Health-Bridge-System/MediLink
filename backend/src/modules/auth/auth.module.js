import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { validate } from '../../common/pipes/zod-validation.pipe.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { demoLoginDto, loginDto, registerDto } from './dto/auth.dto.js';

export default defineModule({
  name: 'auth',
  path: '/auth',
  providers: {
    authService: (c) => new AuthService({ prisma: c.resolve('prisma'), events: c.resolve('events'), demoMode: c.resolve('config').DEMO_MODE }),
  },
  routes: (r, c) => {
    const controller = new AuthController({ authService: c.resolve('authService'), events: c.resolve('events') });
    r.post('/login', validate({ body: loginDto }), controller.login);
    r.post('/register', validate({ body: registerDto }), controller.register);
    r.get('/demo-accounts', controller.demoAccounts);
    r.post('/demo-login', validate({ body: demoLoginDto }), controller.demoLogin);
    r.get('/me', JwtAuthGuard, controller.me);
  },
});

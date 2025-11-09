import { Router } from 'express';

const router = Router();

router.get('/faqs', (req, res) => {
  res.json([
    { id: 1, question: '¿Cómo cambio mi contraseña?', answer: 'Ve a Configuración > Perfil.' },
    { id: 2, question: '¿Cómo contacto soporte?', answer: 'Completa el formulario de ticket.' },
  ]);
});

router.post('/', (req, res) => {
  const { subject, message } = req.body;
  console.log('Nuevo ticket recibido:', subject, message); // eslint-disable-line no-console
  res.status(201).json({ message: 'Ticket recibido correctamente' });
});

export default router;



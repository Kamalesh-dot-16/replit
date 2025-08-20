import express from 'express';
import passport from 'passport';

const router = express.Router();

// 👇 Start Google OAuth flow
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// 👇 Handle Google OAuth callback
router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',   // Where to go if login fails
    successRedirect: '/',        // Where to go if login succeeds
  })
);

// 👇 Optional: Alias for /api/login
router.get('/api/login', (req, res) => {
  res.redirect('/auth/google');
});

// 👇 Optional: Logout route
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

export default router;

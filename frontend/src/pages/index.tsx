import React from 'react';

const Pages = { 
    LoginPage: React.lazy(() => import('./LoginPage')),
    SignupPage: React.lazy(() => import('./SignupPage')),
    StartupSearchPage: React.lazy(() => import('./StartupSearchPage')),
    HomePage: React.lazy(() => import('./HomePage')),
    ContactPage: React.lazy(() => import('./ContactPage')),
    AboutPage: React.lazy(() => import('./AboutPage')),
}

export default Pages;
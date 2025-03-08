const plugin = require("tailwindcss/plugin")

module.exports = {
    content: [
        './app/views/**/*.{html,html.erb,erb,rb}',
        './app/helpers/**/*.rb',
        './app/javascript/**/*.js'
    ],
    theme: {
        extend: {
            // colors: {
            //     primary: 'var(--color-primary)',
            //     secondary: 'var(--color-secondary)',
            //     dark: 'var(--color-dark)',
            //     neutral: 'var(--color-neutral)',
            //     light: 'var(--color-light)',
            //     errordark: 'var(--color-errordark)',
            //     error: 'var(--color-error)',
            //     errorbg: 'var(--color-errorbg)',
            // },
            spacing: {
                'default': '1.5rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms')
    ],
} 
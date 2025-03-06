const plugin = require("tailwindcss/plugin")

module.exports = {
    content: [
        './app/views/**/*.{html,html.erb,erb,rb}',
        './app/helpers/**/*.rb',
        './app/javascript/**/*.js'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#191AD1',
                secondary: '#E5E7EB',
                dark: '#111827',
                neutral: '#6B7280',
                light: '#D1D5DB',
                errordark: '#DC2626',
                error: '#EF4444',
                errorbg: '#FEF2F2',
            },
            spacing: {
                'default': '1.5rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        plugin(({ addUtilities }) => {
            const newUtilities = {
                '.btn-primary': {
                    backgroundColor: '#191AD1',
                    color: '#EEEEEE',
                    padding: '.5rem 1rem',
                    borderRadius: '.5rem',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#2B2EFD',
                    },
                    '&:disabled': {
                        backgroundColor: '#E5E7EB', //gray-200
                        color: '#1F2937', // gray-800
                        cursor: 'not-allowed',
                    },
                },
                '.btn-secondary': {
                    backgroundColor: '#FFFFFF',
                    color: '#1F2937',
                    padding: '.5rem 1rem',
                    border: '1px solid #E5E7EB',
                    borderRadius: '.5rem',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#F2F2F2',
                    },
                    '&:disabled': {
                        backgroundColor: '#E5E7EB',
                        color: '#1F2937',
                        cursor: 'not-allowed',
                    },
                },
                '.btn-danger': {
                    backgroundColor: '#FEF2F2', //red-50
                    color: '#DC2626', //red-600
                    padding: '.5rem 1rem',
                    borderRadius: '.5rem',
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: '#FEE2E2', //red-100
                    },
                    '&:disabled': {
                        backgroundColor: '#E5E7EB',
                        color: '#1F2937',
                        cursor: 'not-allowed',
                    },
                }
            }
            addUtilities(newUtilities, ['responsive', 'hover']) // Adiciona variantes como `hover` e `responsive` se necessário
        })
    ],
} 
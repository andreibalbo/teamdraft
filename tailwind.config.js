module.exports = {
    content: [
        './app/views/**/*.{html,html.erb,erb,rb}',
        './app/helpers/**/*.rb',
        './app/javascript/**/*.js'
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3490dc',
                secondary: '#ffed4a',
                danger: '#e3342f',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
} 
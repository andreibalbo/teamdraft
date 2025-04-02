import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    connect() {
        this.setupModalListeners()
    }

    setupModalListeners() {
        console.log('setupModalListeners')
        document.querySelectorAll('[data-modal-target]').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.getAttribute('data-modal-target')
                const modal = document.getElementById(modalId)
                modal.classList.remove('!hidden')
                modal.classList.add('!flex')
            })
        })

        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal')
                modal.classList.add('!hidden')
                modal.classList.remove('!flex')
            })
        })

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('!hidden')
                    modal.classList.remove('!flex')
                }
            })
        })
    }
} 
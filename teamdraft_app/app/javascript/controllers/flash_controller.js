import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    connect() {
        this.fadeOut()
    }

    fadeOut() {
        setTimeout(() => {
            this.element.style.opacity = '0'
            setTimeout(() => {
                this.element.remove()
            }, 300)
        }, 3000)
    }

    close() {
        this.element.remove()
    }
} 
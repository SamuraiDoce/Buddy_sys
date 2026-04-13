// Client Manager Logic
class CRMApp {
    constructor() {
        this.clients = JSON.parse(localStorage.getItem('crm-clients')) || [];
        this.currentFilter = 'All';
        this.searchQuery = '';
        
        // DOM Elements
        this.clientsGrid = document.getElementById('clients-grid');
        this.clientForm = document.getElementById('client-form');
        this.modalOverlay = document.getElementById('modal-overlay');
        this.addClientBtn = document.getElementById('add-client-btn');
        this.modalClose = document.getElementById('modal-close');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.viewTitle = document.getElementById('view-title');
        this.clientCount = document.getElementById('client-count');
        this.searchInput = document.getElementById('search-input');
        this.navItems = document.querySelectorAll('.nav-item');
        this.exportJsonBtn = document.getElementById('export-json-btn');
        this.exportTxtBtn = document.getElementById('export-txt-btn');
        
        this.init();
    }

    init() {
        // Event Listeners
        this.addClientBtn.addEventListener('click', () => this.openModal());
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.clientForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.exportJsonBtn.addEventListener('click', () => this.exportJSON());
        this.exportTxtBtn.addEventListener('click', () => this.exportTXT());
        
        this.navItems.forEach(item => {
            item.addEventListener('click', () => this.handleFilter(item));
        });

        // Close modal on click outside
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });

        this.render();
    }

    // Modal Methods
    openModal(client = null) {
        const modalTitle = document.getElementById('modal-title');
        const submitBtn = this.clientForm.querySelector('button[type="submit"]');
        
        if (client) {
            modalTitle.innerText = 'Editar Cliente';
            submitBtn.innerText = 'Atualizar Cliente';
            document.getElementById('client-id').value = client.id;
            document.getElementById('name').value = client.name;
            document.getElementById('whatsapp').value = client.whatsapp;
            document.getElementById('email').value = client.email || '';
            document.getElementById('location').value = client.location || '';
            document.getElementById('status').value = client.status;
        } else {
            modalTitle.innerText = 'Cadastrar Novo Cliente';
            submitBtn.innerText = 'Salvar Cliente';
            this.clientForm.reset();
            document.getElementById('client-id').value = '';
        }
        
        this.modalOverlay.style.display = 'flex';
    }

    closeModal() {
        this.modalOverlay.style.display = 'none';
        this.clientForm.reset();
    }

    // Logic Methods
    handleFormSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('client-id').value;
        const clientData = {
            id: id || Date.now().toString(),
            name: document.getElementById('name').value,
            whatsapp: document.getElementById('whatsapp').value.replace(/\D/g, ''),
            email: document.getElementById('email').value,
            location: document.getElementById('location').value,
            status: document.getElementById('status').value,
            createdAt: new Date().toISOString()
        };

        if (id) {
            // Update
            const index = this.clients.findIndex(c => c.id === id);
            this.clients[index] = { ...this.clients[index], ...clientData };
        } else {
            // Create
            this.clients.unshift(clientData);
        }

        this.saveClients();
        this.closeModal();
        this.render();
    }

    handleSearch(e) {
        this.searchQuery = e.target.value.toLowerCase();
        this.render();
    }

    handleFilter(item) {
        this.navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        const filterMap = {
            'nav-all': 'All',
            'nav-negotiation': 'Em Negociação',
            'nav-sold': 'Vendido',
            'nav-cancelled': 'Cancelado',
            'nav-no-status': 'Sem Status'
        };
        
        this.currentFilter = filterMap[item.id] || 'All';
        this.viewTitle.innerText = item.innerText.trim();
        this.render();
    }

    deleteClient(id) {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            this.clients = this.clients.filter(c => c.id !== id);
            this.saveClients();
            this.render();
        }
    }

    saveClients() {
        localStorage.setItem('crm-clients', JSON.stringify(this.clients));
    }

    exportJSON() {
        if (this.clients.length === 0) {
            alert('Não há clientes para exportar.');
            return;
        }
        const dataStr = JSON.stringify(this.clients, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_crm_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    exportTXT() {
        if (this.clients.length === 0) {
            alert('Não há clientes para exportar.');
            return;
        }
        let content = "RELATÓRIO DE CLIENTES - CRM BUDDY\n";
        content += "==================================\n\n";
        
        this.clients.forEach((client, index) => {
            content += `CLIENTE #${index + 1}\n`;
            content += `Nome: ${client.name}\n`;
            content += `WhatsApp: ${client.whatsapp}\n`;
            content += `E-mail: ${client.email || 'Não informado'}\n`;
            content += `Localização: ${client.location || 'Não informado'}\n`;
            content += `Status: ${client.status}\n`;
            content += `----------------------------------\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_crm_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    }

    getFilteredClients() {
        return this.clients.filter(client => {
            const matchesFilter = this.currentFilter === 'All' || client.status === this.currentFilter;
            const matchesSearch = client.name.toLowerCase().includes(this.searchQuery) || 
                                 client.location.toLowerCase().includes(this.searchQuery);
            return matchesFilter && matchesSearch;
        });
    }

    // Rendering
    render() {
        const filtered = this.getFilteredClients();
        this.clientCount.innerText = `${filtered.length} cliente${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`;
        
        if (filtered.length === 0) {
            this.clientsGrid.innerHTML = `
                <div class="loading-state">
                    <i class="ph ph-mask-sad" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <p>Nenhum cliente encontrado.</p>
                </div>
            `;
            return;
        }

        this.clientsGrid.innerHTML = filtered.map(client => {
            const statusClass = client.status.toLowerCase().replace(/ /g, '-').replace(/[áàâã]/g, 'a').replace(/[éèê]/g, 'e').replace(/[íìî]/g, 'i').replace(/[óòôõ]/g, 'o').replace(/[úùû]/g, 'u').replace(/ç/g, 'c');
            
            // Fix status class for CSS mapping
            const cleanStatusClass = this.getStatusClass(client.status);
            
            return `
                <div class="client-card" style="animation-delay: 0.1s">
                    <div class="card-header">
                        <span class="status-badge status-${cleanStatusClass}">${client.status}</span>
                        <div class="card-actions">
                            <button class="action-btn" onclick="app.openModal(${JSON.stringify(client).replace(/"/g, '&quot;')})">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="app.deleteClient('${client.id}')">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="client-info">
                        <h3>${client.name}</h3>
                        <p><i class="ph ph-map-pin"></i> ${client.location || 'Local não informado'}</p>
                    </div>
                    <div class="contact-channels">
                        <a href="https://wa.me/55${client.whatsapp}" target="_blank" class="contact-link whatsapp-link">
                            <i class="ph-fill ph-whatsapp-logo"></i> WhatsApp
                        </a>
                        ${client.email ? `
                        <a href="mailto:${client.email}" class="contact-link email-link">
                            <i class="ph ph-envelope"></i> E-mail
                        </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    getStatusClass(status) {
        switch(status) {
            case 'Em Negociação': return 'negotiation';
            case 'Vendido': return 'sold';
            case 'Cancelado': return 'cancelled';
            case 'Finalizado': return 'finalized';
            case 'Sem Status': return 'no-status';
            default: return 'waiting';
        }
    }
}

// Global instance
const app = new CRMApp();
window.app = app; // For onclick handlers

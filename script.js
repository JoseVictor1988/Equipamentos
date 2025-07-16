document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // CONFIGURAÇÕES - VERIFIQUE SE ESTÃO CORRETAS
    // =================================================================================
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyTyWqgCzBbkUKcm0HSVG0D_i62_SvOGceLTxjvyS5PLYSodV5ibIYFw7Z1td-Vm5EQ/exec';
    // Objeto para armazenar os caminhos das imagens dos maquinários
    const imagensMaquinarios = {
        'Retroescavadeira': 'imagem/retroescavadeira.png',
        'Pá Carregadeira': 'imagem/pa_carregadeira.png',
        'Escavadeira Hidráulica': 'imagem/escavadeira_hidraulica.png',
        'Trator de Esteira': 'imagem/trator_esteira.png',
        'Caminhão Caçamba': 'imagem/caminhao_cacamba.png',
        'Caminhão Pipa': 'imagem/caminhao_pipa.png',
        'Van Sprinter': 'imagem/van_sprinter.png',
        // Adicione mais maquinários conforme necessário
    };
    // =================================================================================


    const datePicker = document.getElementById('date-picker');
    const dateDisplay = document.getElementById('date-display');
    const slidesContainer = document.getElementById('slides-container');
    const dotsContainer = document.getElementById('slider-dots');
    const loadingIndicator = document.getElementById('loading-indicator');
    const noDataMessage = document.getElementById('no-data-message');
    const cardTemplate = document.getElementById('equipment-card-template');
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const sliderArrows = document.getElementById('slider-arrows');
    if (!isTouchDevice) {
        sliderArrows.style.display = 'flex';
    }

    // Função para formatar a data para o padrão da API (DD/MM/YYYY)
    const formatDateForAPI = (date) => {
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = String(date.getMonth() + 1).padStart(2, '0');
        const ano = date.getFullYear();
        return `${dia}/${mes}/${ano}`;
    };

    // Função para formatar a data para exibição no botão
    const formatDateForDisplay = (date) => {
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(date);
    };

    // Função para buscar os dados na planilha
    const fetchData = (dateString, displayDate) => {
        slidesContainer.innerHTML = '';
        dotsContainer.innerHTML = '';
        noDataMessage.style.display = 'none';
        loadingIndicator.style.display = 'block';
        dateDisplay.textContent = formatDateForDisplay(displayDate);

        const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        const url = `${SCRIPT_URL}?callback=${callbackName}&data=${dateString}`;

        window[callbackName] = (data) => {
            renderData(data);
            delete window[callbackName];
            document.body.removeChild(script);
        };

        const script = document.createElement('script');
        script.onerror = () => {
            loadingIndicator.style.display = 'none';
            noDataMessage.innerHTML = '<p>Erro ao buscar dados. Verifique a conexão ou a URL da API.</p>';
            noDataMessage.style.display = 'block';
        }
        script.src = url;
        document.body.appendChild(script);
    };

    // Função para renderizar os dados na tela
    const renderData = (data) => {
        loadingIndicator.style.display = 'none';
        const equipmentTypes = Object.keys(data);

        if (equipmentTypes.length === 0 || Object.keys(data).every(k => data[k].length === 0)) {
            noDataMessage.style.display = 'block';
            return;
        }

        equipmentTypes.forEach((type, index) => {
            const equipmentList = data[type];
            if (equipmentList.length > 0) {
                createSlideCard(type, equipmentList, index);
                createDot(index);
            }
        });

        setupSliderObserver();
        afterRenderSlides();
    };

    // Função para criar um card de equipamento (COM A LÓGICA DE CLASSE DE STATUS)
    const createSlideCard = (type, list, index) => {
        const cardClone = cardTemplate.content.cloneNode(true);
        const card = cardClone.querySelector('.slide-card');
        card.dataset.index = index;

        card.querySelector('.equipment-type').textContent = type;

        const imageContainer = card.querySelector('.equipment-image-container');
        if (imagensMaquinarios[type]) {
            const img = document.createElement('img');
            img.src = imagensMaquinarios[type];
            img.alt = `Imagem de ${type}`;
            imageContainer.appendChild(img);
        } else {
            imageContainer.textContent = 'Imagem não disponível';
        }

        const scheduleList = card.querySelector('.schedule-list');
        list.forEach((item, itemIndex) => {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.style.animationDelay = `${itemIndex * 100}ms`;

            // *** INÍCIO DA MUDANÇA PRINCIPAL ***
            // Verifica o status de cada turno para aplicar a classe correta
            const statusTurno1 = item.turno1.toLowerCase().includes('sem escala') ? 'is-inactive' : 'is-active';
            const statusTurno2 = item.turno2.toLowerCase().includes('sem escala') ? 'is-inactive' : 'is-active';
            const statusTurno3 = item.turno3.toLowerCase().includes('sem escala') ? 'is-inactive' : 'is-active';

            scheduleItem.innerHTML = `
                <h3 class="machine-id">${item.maquinario}</h3>
                <div class="shifts-grid">
                    <div class="shift-info ${statusTurno1}">
                        <span class="shift-label">1º Turno</span>
                        <span class="shift-time">${item.turno1}</span>
                    </div>
                    <div class="shift-info ${statusTurno2}">
                        <span class="shift-label">2º Turno</span>
                        <span class="shift-time">${item.turno2}</span>
                    </div>
                    <div class="shift-info ${statusTurno3}">
                        <span class="shift-label">3º Turno</span>
                        <span class="shift-time">${item.turno3}</span>
                    </div>
                </div>
            `;
            // *** FIM DA MUDANÇA PRINCIPAL ***

            scheduleList.appendChild(scheduleItem);
        });

        slidesContainer.appendChild(cardClone);
    };

    // Função para criar um ponto de navegação
    const createDot = (index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.dataset.index = index;
        dotsContainer.appendChild(dot);
    };

    // Observador para sincronizar os pontos com o slide visível
    const setupSliderObserver = () => {
        const dots = dotsContainer.querySelectorAll('.dot');
        if (dots.length > 0) {
            dots[0].classList.add('active');
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = entry.target.dataset.index;
                    dots.forEach(dot => dot.classList.remove('active'));
                    const activeDot = dotsContainer.querySelector(`.dot[data-index='${index}']`);
                    if (activeDot) {
                        activeDot.classList.add('active');
                    }
                }
            });
        }, {
            root: slidesContainer,
            threshold: 0.5
        });

        slidesContainer.querySelectorAll('.slide-card').forEach(card => {
            observer.observe(card);
        });
    };

    let currentSlide = 0;

    function showSlide(index) {
        const cards = slidesContainer.querySelectorAll('.slide-card');
        if (cards.length === 0) return;
        if (index < 0) index = 0;
        if (index >= cards.length) index = cards.length - 1;
        cards.forEach((card, i) => {
            card.style.display = i === index ? 'block' : 'none';
        });
        currentSlide = index;
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    // Eventos das setas
    if (!isTouchDevice) {
        document.getElementById('arrow-left').addEventListener('click', prevSlide);
        document.getElementById('arrow-right').addEventListener('click', nextSlide);

        // Navegação por teclado
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') prevSlide();
            if (e.key === 'ArrowRight') nextSlide();
        });
    }

    // No celular, ativar swipe
    if (isTouchDevice) {
        let startX = 0;
        slidesContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });
        slidesContainer.addEventListener('touchend', (e) => {
            let endX = e.changedTouches[0].clientX;
            if (endX < startX - 50) nextSlide();
            if (endX > startX + 50) prevSlide();
        });
    }

    // Sempre que renderizar os slides, mostrar o primeiro
    function afterRenderSlides() {
        showSlide(0);
    }

    // Inicialização do App
    const init = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        datePicker.value = `${yyyy}-${mm}-${dd}`;

        fetchData(formatDateForAPI(today), today);

        // Ativar Flatpickr no input de data
        flatpickr("#date-picker", {
            dateFormat: "Y-m-d",
            locale: "pt",
            defaultDate: new Date(),
            onChange: function (selectedDates, dateStr, instance) {
                const [year, month, day] = dateStr.split('-');
                const selectedDate = new Date(year, month - 1, day);
                fetchData(formatDateForAPI(selectedDate), selectedDate);
            }
        });
    };

    init();
});
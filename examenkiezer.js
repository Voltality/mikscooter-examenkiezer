/**
 * MikScooter — Examenkiezer page custom code
 * Version: 1.1.0
 * Last updated: 2026-04-10
 * Source: https://github.com/GitVoltality/mikscooter-examenkiezer
 *
 * Note: this file was migrated from the Webflow "Before </body>" custom code
 * field, which contained 18 separate <script> blocks. The tags have been
 * stripped; each block's contents run top-to-bottom as they did in Webflow.
 */

//
// === PAYMENT RECOVERY BANNER v2 ===
// Toont banner alleen als de vorige redirect ECHT gestrand is
// (geen beforeunload heeft gevuurd → user heeft Mollie nooit bereikt)
//
document.addEventListener('DOMContentLoaded', function() {
    try {
        var savedLink = sessionStorage.getItem('mikscooter_last_paymentlink');
        var savedTime = parseInt(sessionStorage.getItem('mikscooter_last_paymentlink_time') || '0', 10);
        var redirectCompleted = sessionStorage.getItem('mikscooter_last_redirect_completed') === '1';
        var ageMinutes = (Date.now() - savedTime) / 1000 / 60;

        // Cleanup verlopen of voltooide attempts
        if (savedLink && (ageMinutes >= 12 || redirectCompleted)) {
            sessionStorage.removeItem('mikscooter_last_paymentlink');
            sessionStorage.removeItem('mikscooter_last_paymentlink_time');
            sessionStorage.removeItem('mikscooter_last_redirect_completed');

            if (typeof trackEvent === 'function') {
                trackEvent('payment_recovery_skipped', {
                    reason: redirectCompleted ? 'redirect_completed' : 'expired',
                    ageMinutes: Math.round(ageMinutes)
                });
            }
            return;
        }

        // Banner alleen tonen voor gestrande redirects
        if (savedLink && savedTime > 0 && ageMinutes < 12 && !redirectCompleted) {
            var banner = document.createElement('div');
            banner.id = 'payment-recovery-banner';
            banner.style.cssText =
                'position:fixed;top:0;left:0;right:0;background:#ffcc00;color:#000;' +
                'padding:14px 16px;text-align:center;z-index:999997;' +
                'box-shadow:0 2px 12px rgba(0,0,0,0.2);font-size:0.95rem;' +
                'font-family:Arial,sans-serif;line-height:1.4;';
            banner.innerHTML =
                '<b>Je betaling werd niet voltooid.</b> ' +
                '<a href="' + savedLink + '" id="payment-recovery-link" ' +
                'style="color:#000;text-decoration:underline;font-weight:bold;margin:0 8px;">' +
                'Probeer opnieuw →</a>' +
                '<span id="payment-recovery-close" ' +
                'style="cursor:pointer;margin-left:12px;opacity:0.6;font-size:1.2rem;">' +
                '✕</span>';
            document.body.insertBefore(banner, document.body.firstChild);

            document.getElementById('payment-recovery-close').addEventListener('click', function() {
                try {
                    sessionStorage.removeItem('mikscooter_last_paymentlink');
                    sessionStorage.removeItem('mikscooter_last_paymentlink_time');
                    sessionStorage.removeItem('mikscooter_last_redirect_completed');
                } catch(e) {}
                banner.remove();
                if (typeof trackEvent === 'function') {
                    trackEvent('payment_recovery_dismissed', {});
                }
            });

            document.getElementById('payment-recovery-link').addEventListener('click', function() {
                if (typeof trackEvent === 'function') {
                    trackEvent('payment_recovery_link_clicked', {
                        ageMinutes: Math.round(ageMinutes)
                    });
                }
            });

            if (typeof trackEvent === 'function') {
                trackEvent('payment_recovery_banner_shown', {
                    ageMinutes: Math.round(ageMinutes)
                });
            }
        }
    } catch(e) {
        console.warn('[Payment Recovery] sessionStorage niet beschikbaar:', e);
    }
});

// === PAGE READY ===
window.addEventListener('load', function() {
    document.documentElement.classList.add('page-ready');
});

// === STAD SELECTIE - "Alle steden" als default ===
document.addEventListener('DOMContentLoaded', function() {
    var stadSelect = document.getElementById('stad');
    var examWrapper = document.getElementById('PraktijkexamenWrapper');
    var stadUitleg = document.getElementById('Stad-Uitleg');
    
    if (!stadSelect || !examWrapper) return;
    
    examWrapper.style.transition = 'opacity 300ms ease-in-out';
    if (stadUitleg) stadUitleg.style.transition = 'opacity 300ms ease-in-out';
    
    examWrapper.style.display = 'none';
    examWrapper.style.opacity = '0';
    
    function updateVisibility() {
        var value = stadSelect.value;
        var text = stadSelect.options[stadSelect.selectedIndex]?.text || '';
        var items = examWrapper.querySelectorAll('[fs-list-field="stad"]');
        
        var isKies = value === '' || text.toLowerCase().includes('kies');
        var isAlle = text.toLowerCase().includes('alle steden') || value.toLowerCase().includes('alle steden');
        
        if (isKies && !isAlle) {
            // Verberg lijst
            examWrapper.style.opacity = '0';
            setTimeout(function() { examWrapper.style.display = 'none'; }, 300);
            
            if (stadUitleg) {
                stadUitleg.style.display = 'block';
                setTimeout(function() { stadUitleg.style.opacity = '1'; }, 10);
            }
        } else {
            // Toon lijst
            if (stadUitleg) {
                stadUitleg.style.opacity = '0';
                setTimeout(function() { stadUitleg.style.display = 'none'; }, 300);
            }
            
            examWrapper.style.display = 'block';
            setTimeout(function() { examWrapper.style.opacity = '1'; }, 10);
            
            items.forEach(function(item) {
                var parent = item.closest('.w-dyn-item') || item.closest('[role="listitem"]') || item.parentElement;
                if (parent) {
                    parent.style.display = (isAlle && item.textContent.trim() === 'X-Open') ? 'none' : '';
                }
            });
            
            if (!isAlle && typeof trackEvent === 'function') {
                trackEvent('stad_selected', { stad: value, stadText: text });
            }
        }
    }
    
    updateVisibility();
    stadSelect.addEventListener('change', updateVisibility);
    stadSelect.addEventListener('input', updateVisibility);
    
    // === Finsweet integratie ===
    window.fsAttributes = window.fsAttributes || [];
    window.fsAttributes.push(['cmsfilter', function(filterInstances) {
        filterInstances.forEach(function(instance) {
            instance.on('renderitems', function() {
                var text = stadSelect.options[stadSelect.selectedIndex]?.text || '';
                
                if (examWrapper.style.display === 'none') {
                    examWrapper.style.display = 'block';
                    examWrapper.style.opacity = '1';
                }
                
                if (text.toLowerCase().includes('alle steden')) {
                    examWrapper.querySelectorAll('[fs-list-field="stad"]').forEach(function(item) {
                        var parent = item.closest('.w-dyn-item') || item.closest('[role="listitem"]') || item.parentElement;
                        if (parent && item.textContent.trim() === 'X-Open') {
                            parent.style.display = 'none';
                        }
                    });
                }
            });
        });
        setTimeout(updateVisibility, 200);
    }]);
});


// === HIDDEN FIELDS - Standaard waarden ===
document.addEventListener('DOMContentLoaded', function() {
    var defaults = {
        'Hidden-Bedrijf': 'MikScooter',
        'Hidden-Opleiding': 'Bromfiets'
    };
    
    Object.entries(defaults).forEach(function(entry) {
        var field = document.getElementById(entry[0]);
        if (field) field.value = entry[1];
    });
});


//
// === EXAMEN SELECTIE - Hidden fields vullen ===
//
document.addEventListener('DOMContentLoaded', function() {
    
    function triggerValidation(element) {
        ['input', 'change', 'blur'].forEach(function(eventType) {
            element.dispatchEvent(new Event(eventType, { bubbles: true, cancelable: true }));
        });
        element.focus();
        element.blur();
    }
    
    document.addEventListener('change', function(e) {
        if (e.target.getAttribute('naam') !== 'selected-exam') return;
        
        var target = e.target;
        var fieldData = {
            'Hidden-PraktijkexamenID': target.getAttribute('praktijkexamenid'),
            'Hidden-ExamenID-met-Examendata': target.getAttribute('examenid-met-examendata'),
            'Hidden-AirtableRecordID': target.getAttribute('airtablerecordid'),
            'Hidden-BedrijfsAirtableID': target.getAttribute('bedrijf-airtablerecordid'),
            'Hidden-OpleidingAirtableID': target.getAttribute('opleiding-airtablerecordid'),
            'Hidden-Lessoort': target.getAttribute('lessoort'),
            'Hidden-Lesdagnaam': target.getAttribute('lesdagnaam'),
            'Hidden-Product-AirtableID': target.getAttribute('product-airtablerecordid')
        };
        
        if (typeof trackEvent === 'function') {
            trackEvent('exam_selected', {
                praktijkexamenID: fieldData['Hidden-PraktijkexamenID'],
                lessoort: fieldData['Hidden-Lessoort']
            });
        }
        
        Object.entries(fieldData).forEach(function(entry) {
            var field = document.getElementById(entry[0]);
            if (field && (entry[1] || !field.value)) {
                field.value = entry[1] || '';
                triggerValidation(field);
            }
        });
    });
});


//
// === EXAMEN SELECTIE - Verberg andere tiles ===
//
document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('change', function(e) {
        if (e.target.getAttribute('naam') !== 'selected-exam') return;
        
        var allTiles = document.querySelectorAll('.w-dyn-item');
        var selectedTile = e.target.closest('.w-dyn-item');
        
        if (!selectedTile) return;
        
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        
        allTiles.forEach(function(tile) {
            tile.style.transition = 'all 300ms ease-out';
        });
        
        setTimeout(function() {
            allTiles.forEach(function(tile) {
                if (tile !== selectedTile) {
                    tile.style.opacity = '0';
                    tile.style.maxHeight = '0';
                    tile.style.marginTop = '0';
                    tile.style.marginBottom = '0';
                    tile.style.overflow = 'hidden';
                    tile.style.pointerEvents = 'none';
                }
            });
        }, 100);
    });
});


//
// === RESET BUTTONS ===
//
document.addEventListener('DOMContentLoaded', function() {
    
    // === Reset praktijklocaties ===
    var resetLocaties = document.getElementById('Resetbutton-praktijklocaties');
    if (resetLocaties) {
        resetLocaties.addEventListener('click', function(e) {
            e.preventDefault();
            var container = document.getElementById('Praktijklocatie-Checkboxes');
            if (container) {
                container.querySelectorAll('input[type="checkbox"]').forEach(function(cb) {
                    cb.checked = false;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }
            if (typeof trackEvent === 'function') trackEvent('praktijklocaties_reset', {});
        });
    }
    
    // === Reset examenkiezer ===
    function executeReset(e) {
        e.preventDefault();
        
        if (typeof trackEvent === 'function') {
            trackEvent('examenkiezer_reset', { triggeredBy: e.target.id });
        }
        
        // === Reset hidden fields ===
        var fieldsToReset = [
            'Hidden-PraktijkexamenID', 'Hidden-ExamenID-met-Examendata', 'Hidden-AirtableRecordID',
            'Hidden-BedrijfsAirtableID', 'Hidden-OpleidingAirtableID', 'Hidden-Lessoort', 'Hidden-Lesdagnaam'
        ];
        
        fieldsToReset.forEach(function(id) {
            var field = document.getElementById(id);
            if (field) {
                field.value = '';
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // === Reset stad naar "Alle steden" ===
        var stadSelect = document.getElementById('stad');
        if (stadSelect) {
            var allestedenOption = Array.from(stadSelect.options).find(function(opt) {
                return opt.text.toLowerCase().includes('alle steden');
            });
            stadSelect.value = allestedenOption ? allestedenOption.value : stadSelect.options[0]?.value || '';
            stadSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // === Reset checkboxes ===
        ['Groepsles', 'Individueel', 'Lessen-in-weekend'].forEach(function(id) {
            var checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // === Reset radio buttons ===
        document.querySelectorAll('input[naam="selected-exam"]').forEach(function(radio) {
            radio.checked = false;
            radio.classList.remove('is-active');
        });
        
        document.querySelectorAll('.form_radio-tile.exam-selection').forEach(function(tile) {
            tile.classList.remove('is-active', 'is-list-active');
        });
        
        document.querySelectorAll('.w-form-formradioinput').forEach(function(visual) {
            visual.classList.remove('is-active', 'w--redirected-checked');
        });
        
        // === Reset tile visibility ===
        document.querySelectorAll('.w-dyn-item').forEach(function(tile) {
            tile.style.transition = 'all 300ms ease-in';
            tile.style.opacity = '1';
            tile.style.maxHeight = '';
            tile.style.marginTop = '';
            tile.style.marginBottom = '';
            tile.style.overflow = '';
            tile.style.pointerEvents = '';
        });
    }
    
    ['Resetbutton-CMS-Examens', 'Resetbutton-GekozenExamen'].forEach(function(id) {
        var button = document.getElementById(id);
        if (button) button.addEventListener('click', executeReset);
    });
});


//
// === MENU VISIBILITY - Gebaseerd op examen selectie ===
//
document.addEventListener('DOMContentLoaded', function() {
    var hiddenExamField = document.getElementById('Hidden-PraktijkexamenID');
    var menuCMS = document.getElementById('Menu-CMS-Examenkiezer');
    var menuGekozen = document.getElementById('Menu-GekozenExamen');
    
    if (!hiddenExamField || !menuCMS || !menuGekozen) return;
    
    menuCMS.style.transition = 'opacity 300ms ease-in-out';
    menuGekozen.style.transition = 'opacity 300ms ease-in-out';
    
    function updateMenuVisibility() {
        var hasExam = hiddenExamField.value.trim() !== '';
        
        if (hasExam) {
            menuCMS.style.opacity = '0';
            setTimeout(function() {
                menuCMS.style.display = 'none';
                menuGekozen.style.display = 'block';
                setTimeout(function() { menuGekozen.style.opacity = '1'; }, 10);
            }, 300);
        } else {
            menuGekozen.style.opacity = '0';
            setTimeout(function() {
                menuGekozen.style.display = 'none';
                menuCMS.style.display = 'block';
                setTimeout(function() { menuCMS.style.opacity = '1'; }, 10);
            }, 300);
        }
    }
    
    updateMenuVisibility();
    hiddenExamField.addEventListener('input', updateMenuVisibility);
    hiddenExamField.addEventListener('change', updateMenuVisibility);
    new MutationObserver(updateMenuVisibility).observe(hiddenExamField, { attributes: true, attributeFilter: ['value'] });
});


//
// === STEP VISIBILITY - FormCMS zichtbaarheid ===
//
document.addEventListener('DOMContentLoaded', function() {
    var formCMSSelector = document.getElementById('FormCMS-ItemSelector');
    var kiesPraktijkDiv = document.getElementById('KiesPraktijkExamen');
    var praktijkButtons = document.getElementById('PraktijkSelectorButtons');
    var hiddenExamField = document.getElementById('Hidden-PraktijkexamenID');
    
    if (!formCMSSelector || !kiesPraktijkDiv) return;
    
    formCMSSelector.style.display = 'none';
    if (praktijkButtons) praktijkButtons.style.display = 'none';
    
    var examStep = kiesPraktijkDiv.closest('[data-w-tab]') || 
                   kiesPraktijkDiv.closest('.w-tab-pane') || 
                   kiesPraktijkDiv.closest('[class*="step"]');
    
    if (!examStep) return;
    
    function checkStepVisibility() {
        var isHidden = examStep.getAttribute('aria-hidden') === 'true';
        var isDisplayed = window.getComputedStyle(examStep).display !== 'none';
        var isActive = examStep.classList.contains('w--tab-active');
        
        formCMSSelector.style.display = ((!isHidden && isDisplayed) || isActive) ? 'block' : 'none';
    }
    
    setTimeout(checkStepVisibility, 100);
    new MutationObserver(checkStepVisibility).observe(examStep, { attributes: true, attributeFilter: ['aria-hidden', 'class', 'style'] });
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('button, [role="button"], .w-button')) {
            setTimeout(checkStepVisibility, 100);
        }
    });
    
    if (hiddenExamField && praktijkButtons) {
        var checkExamValue = function() {
            praktijkButtons.style.display = hiddenExamField.value.trim() ? 'block' : 'none';
        };
        checkExamValue();
        hiddenExamField.addEventListener('input', checkExamValue);
        hiddenExamField.addEventListener('change', checkExamValue);
    }
});


//
// === POSTCODE FORMATTING + VALIDATIE ===
//
document.addEventListener('DOMContentLoaded', function() {
    var postcodeField = document.querySelector('input[name="Postcode"]');
    if (!postcodeField) return;
    
    postcodeField.addEventListener('input', function(e) {
        var value = e.target.value.replace(/[^a-zA-Z0-9\s]/g, '');
        if (value.startsWith('0')) value = value.substring(1);
        value = value.replace(/^([0-9]{4})([a-zA-Z]{1,2})$/i, '$1 $2').toUpperCase();
        e.target.value = value;
    });
    
    var form = postcodeField.closest('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!/^[1-9][0-9]{3}\s?[A-Z]{2}$/.test(postcodeField.value)) {
                e.preventDefault();
                alert('Vul een geldige Nederlandse postcode in');
                postcodeField.focus();
                if (typeof trackEvent === 'function') {
                    trackEvent('postcode_validation_failed', { postedValue: postcodeField.value });
                }
            }
        });
    }
});


//
// === BETAAL HANDLER v2 ===
// - Fallback UI met klikbare iDEAL knop (Fix 7)
// - Hergebruik recente paymentlink (Fix 5)  
// - Loader sluiten bij invalide form (Fix 8)
// - Fetch timeout (Fix 10)
// - Stalled navigation detection
//
document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('form[data-name="MikScooter-ExamenKiezer"]');
    var betaalButton = document.getElementById('Betalen_MikScooter');
    var loader = document.getElementById('payment-loader');
    var statusText = document.getElementById('loader-status-text');
    
    var statusMessages = [
        "Gegevens versturen...",
        "Examen reserveren...",
        "Betaling voorbereiden...",
        "iDeal-verbinding maken...",
        "iDeal openen..."
    ];
    var textInterval = null;
    var fadeTimeout = null;
    var statusUpdaterActive = false;

    function startStatusUpdates() {
        if (!statusText) return;
        statusUpdaterActive = true;
        var index = 0;
        statusText.textContent = statusMessages[0];

        textInterval = setInterval(function() {
            if (!statusUpdaterActive) return;
            if (index < statusMessages.length - 1) {
                index++;
                statusText.classList.add('fade-out');
                fadeTimeout = setTimeout(function() {
                    if (!statusUpdaterActive) return;
                    statusText.textContent = statusMessages[index];
                    statusText.classList.remove('fade-out');
                }, 300);
            } else {
                clearInterval(textInterval);
                textInterval = null;
            }
        }, 900);
    }

    function stopStatusUpdates() {
        statusUpdaterActive = false;
        if (textInterval) {
            clearInterval(textInterval);
            textInterval = null;
        }
        if (fadeTimeout) {
            clearTimeout(fadeTimeout);
            fadeTimeout = null;
        }
        if (statusText) {
            statusText.classList.remove('fade-out');
        }
    }
    
    // Toon fallback UI met klikbare iDEAL knop binnen de loader
    function showFallbackUI(paymentlink, mode) {
        if (!statusText) return;
        
        var isStalled = (mode === 'stalled');
        var headerHTML = isStalled 
            ? '<div style="color:#cc0000;font-weight:bold;margin-bottom:14px;font-size:1rem;">' +
              'Het automatisch doorsturen lukte niet.</div>'
            : '<div style="margin-bottom:18px;">Je wordt doorgestuurd naar iDEAL...</div>';
        
        var subHTML = isStalled
            ? '<div style="font-size:0.85rem;color:#666;margin-top:16px;line-height:1.4;">' +
              'Tik op de gele knop hierboven om door te gaan.<br>' +
              'Blijft het probleem? Sluit deze pagina en probeer het opnieuw.</div>'
            : '<div style="font-size:0.85rem;color:#666;margin-top:16px;line-height:1.4;">' +
              'Werkt de automatische doorverwijzing niet?<br>' +
              'Tik dan op de gele knop hierboven.</div>';
        
        statusText.innerHTML = 
            headerHTML +
            '<a href="' + paymentlink + '" id="manual-ideal-link" rel="noopener" ' +
            'style="display:inline-block;padding:16px 32px;background:#ffcc00;color:#000;' +
            'text-decoration:none;border-radius:8px;font-weight:bold;font-size:1.1rem;' +
            'box-shadow:0 4px 14px rgba(0,0,0,0.15);">' +
            'Ga naar iDEAL →</a>' +
            subHTML;
        
        var manualLink = document.getElementById('manual-ideal-link');
        if (manualLink) {
            manualLink.addEventListener('click', function() {
                if (typeof trackEvent === 'function') {
                    trackEvent('payment_manual_ideal_click', { mode: mode });
                }
            });
        }
    }
    
    if (!form || !betaalButton || !loader) return;
    
    betaalButton.addEventListener('click', async function(e) {
        if (window.MikTracking) window.MikTracking.formSubmitAttempts++;
        
        if (typeof trackEvent === 'function') {
            trackEvent('payment_button_clicked', {
                attempt: window.MikTracking?.formSubmitAttempts || 1,
                formValid: form.checkValidity()
            });
        }
        
        // === FIX 8: Loader sluiten bij invalide form ===
        if (!form.checkValidity()) {
            if (typeof trackEvent === 'function') {
                trackEvent('payment_blocked_invalid_form', {
                    invalidFields: Array.from(form.querySelectorAll(':invalid')).map(function(el) {
                        return el.name || el.id;
                    })
                });
            }
            
            if (loader) loader.style.display = 'none';
            stopStatusUpdates();
            form.reportValidity();
            
            var firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(function() { firstInvalid.focus(); }, 300);
            }
            
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // === FIX 5: Hergebruik recente paymentlink indien aanwezig ===
        try {
            var existingLink = sessionStorage.getItem('mikscooter_last_paymentlink');
            var existingTime = parseInt(sessionStorage.getItem('mikscooter_last_paymentlink_time') || '0', 10);
            var existingAgeMin = (Date.now() - existingTime) / 1000 / 60;
            
            if (existingLink && existingTime > 0 && existingAgeMin < 12) {
                if (typeof trackEvent === 'function') {
                    trackEvent('payment_reused_existing_link', { 
                        ageMinutes: Math.round(existingAgeMin) 
                    });
                }
                
                loader.style.display = 'flex';
                startStatusUpdates();
                
                setTimeout(function() {
                    stopStatusUpdates();
                    showFallbackUI(existingLink, 'reused');
                    setTimeout(function() { window.location.href = existingLink; }, 1500);
                }, 500);
                
                return;
            }
        } catch(err) { /* sessionStorage niet beschikbaar - ga door */ }
        
        loader.style.display = 'flex';
        startStatusUpdates();
        
        var originalText = betaalButton.value || betaalButton.textContent;
        betaalButton.disabled = true;
        betaalButton.value = betaalButton.textContent = 'Betaallink ophalen...';
        
        try {
            // SessionURL ophalen
            var sessionURL = 'unavailable';
            if (typeof getSessionURL === 'function') {
                try {
                    sessionURL = await Promise.race([
                        getSessionURL(),
                        new Promise(function(resolve) { setTimeout(function() { resolve('timeout'); }, 3000); })
                    ]);
                } catch (err) {
                    sessionURL = 'error';
                }
            }
            
            // Formulierdata verzamelen
            var data = {};
            form.querySelectorAll('input, select, textarea').forEach(function(input) {
                var name = input.name || input.getAttribute('data-name');
                if (!name) return;
                
                if (input.type === 'checkbox' || input.type === 'radio') {
                    if (input.checked) {
                        data[name] = input.value;
                    } else if (!data.hasOwnProperty(name)) {
                        data[name] = '';
                    }
                } else {
                    data[name] = input.value || '';
                }
            });
            
            data['LogRocket-SessionURL'] = sessionURL;
            
            if (typeof trackEvent === 'function') {
                trackEvent('proxy_request_start', {
                    fieldCount: Object.keys(data).length,
                    hasSessionURL: !['unavailable', 'timeout', 'error'].includes(sessionURL)
                });
            }
            
            // === FIX 10: Fetch met timeout van 35s ===
            var fetchController = new AbortController();
            var fetchTimeoutId = setTimeout(function() { fetchController.abort(); }, 35000);
            
            var response = await fetch('https://mikscooterproxy.com/v2/route-1a-mikscooter-send-form-and-get-payment-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: fetchController.signal
            });
            clearTimeout(fetchTimeoutId);
            
            if (typeof trackEvent === 'function') {
                trackEvent('proxy_response_received', { status: response.status, ok: response.ok });
            }
            
            var result = await response.json();
            
            if (typeof trackEvent === 'function') {
                trackEvent('proxy_result_parsed', { success: result.success, hasPaymentLink: !!result.paymentlink });
            }
            
            if (result.success && result.paymentlink) {
                // === FIX 7 v2: Bewaar link met "completed" vlag op false ===
                try {
                    sessionStorage.setItem('mikscooter_last_paymentlink', result.paymentlink);
                    sessionStorage.setItem('mikscooter_last_paymentlink_time', Date.now().toString());
                    sessionStorage.removeItem('mikscooter_last_redirect_completed');
                } catch(err) { /* sessionStorage uitgeschakeld */ }

                // Stop status updates VOLLEDIG voordat we de UI vervangen
                stopStatusUpdates();

                if (typeof trackEvent === 'function') {
                    trackEvent('payment_redirect_starting', {
                        paymentId: result.paymentId || 'unknown'
                    });
                }

                // Toon fallback UI op next microtask (na pending callbacks)
                Promise.resolve().then(function() {
                    showFallbackUI(result.paymentlink, 'normal');
                });

                // Track of beforeunload vuurt
                var autoRedirectStartTime = Date.now();
                var unloadFired = false;
                window.addEventListener('beforeunload', function() {
                    unloadFired = true;
                    try {
                        sessionStorage.setItem('mikscooter_last_redirect_completed', '1');
                    } catch(e) {}
                });

                // Auto-redirect na 600ms (sneller dan voorheen, knop is al zichtbaar)
                setTimeout(function() {
                    window.location.href = result.paymentlink;
                }, 600);

                // Stalled navigation detectie na 10s
                setTimeout(function() {
                    if (!unloadFired && document.visibilityState === 'visible') {
                        if (typeof trackEvent === 'function') {
                            trackEvent('payment_redirect_appears_stalled', {
                                msSinceAutoStart: Date.now() - autoRedirectStartTime,
                                userAgent: navigator.userAgent
                            });
                        }
                        showFallbackUI(result.paymentlink, 'stalled');
                    }
                }, 10000);

            } else {
                throw new Error(result.error || 'Geen betaallink ontvangen');
            }
            
        } catch (error) {
            if (typeof trackEvent === 'function') {
                trackEvent('payment_process_error', { 
                    errorMessage: error.message,
                    isAbortError: error.name === 'AbortError'
                });
            }
            
            loader.style.display = 'none';
            stopStatusUpdates();
            
            var errorDiv = document.querySelector('.w-form-fail');
            if (errorDiv) {
                errorDiv.style.display = 'block';
                var errMsg = error.name === 'AbortError' 
                    ? 'De verbinding met het betaalsysteem duurde te lang. Controleer je internetverbinding en probeer opnieuw.'
                    : 'Er ging iets mis: ' + error.message + '. Probeer opnieuw of neem contact op.';
                errorDiv.innerHTML = '<div>' + errMsg + '</div>';
            }
            
            betaalButton.disabled = false;
            betaalButton.value = betaalButton.textContent = originalText;
        }
    });
});


//
// === PROXY BUTTON - Veld validatie + PDOK wachten ===
//
document.addEventListener('DOMContentLoaded', function() {
    var proxyButton = document.getElementById('Betaal-Knop-Activator');
    var realSubmitButton = document.getElementById('Betalen_MikScooter');
    
    var emailField = document.getElementById('E-mail');
    var postcodeField = document.getElementById('Postcode');
    var huisnummerField = document.getElementById('Huisnummer');
    var adresField = document.getElementById('VolledigAdres');
    
    if (!proxyButton || !realSubmitButton) return;
    
    function updateButtonStatus() {
        var emailValid = typeof window.isValidEmailFormat === 'function' 
            ? window.isValidEmailFormat(emailField.value) 
            : emailField.value.includes('@');
        var isValid = emailValid && postcodeField.value.length >= 6 && huisnummerField.value.length > 0;
        
        proxyButton.classList.toggle('is-disabled-default', !isValid);
        proxyButton.setAttribute('aria-disabled', !isValid);
        proxyButton.style.cursor = isValid ? 'pointer' : 'not-allowed';
        proxyButton.style.opacity = isValid ? '1' : '0.5';
    }
    
    [emailField, postcodeField, huisnummerField].forEach(function(field) {
        if (field) field.addEventListener('input', updateButtonStatus);
    });
    
    proxyButton.addEventListener('click', async function(e) {
        if (proxyButton.getAttribute('aria-disabled') === 'true') {
            e.preventDefault();
            if (typeof trackEvent === 'function') trackEvent('disabled_button_clicked', {});
            return;
        }
        
        if (typeof trackEvent === 'function') {
            trackEvent('proxy_button_clicked', { hasAdres: !!adresField.value });
        }
        
        var loader = document.querySelector('.payment-loader-overlay');
        if (loader) loader.style.display = 'flex';
        
        [emailField, postcodeField, huisnummerField].forEach(function(field) {
            field.dispatchEvent(new Event('change', { bubbles: true }));
        });
        
        // Wacht op PDOK adres
        var count = 0;
        var maxChecks = 40;
        
        if (typeof trackEvent === 'function') trackEvent('pdok_wait_start', {});
        
        while (!adresField.value && count < maxChecks) {
            await new Promise(function(resolve) { setTimeout(resolve, 100); });
            count++;
        }
        
        if (typeof trackEvent === 'function') {
            trackEvent('pdok_wait_complete', { waitedMs: count * 100, hasAdres: !!adresField.value });
        }
        
        if (adresField.value && adresField.value.length > 5) {
            adresField.dispatchEvent(new Event('change', { bubbles: true }));
            realSubmitButton.click();
        } else {
            if (loader) loader.style.display = 'none';
            alert("Adresgegevens niet opgehaald. Controleer postcode en huisnummer.");
        }
    });
    
    updateButtonStatus();
});


//
// === PRIJS SYNCHRONISATIE ===
//
document.addEventListener('DOMContentLoaded', function() {
    var prijsBron = document.getElementById('Prijsveld');
    var prijsDoel = document.getElementById('PrijsTotaal');
    
    if (!prijsBron || !prijsDoel) return;
    
    var lastPrice = '';
    
    setInterval(function() {
        var currentPrice = (prijsBron.textContent || prijsBron.innerText).trim();
        
        if (currentPrice !== '' && prijsDoel.value !== currentPrice) {
            prijsDoel.value = currentPrice;
            
            if (currentPrice !== lastPrice && typeof trackEvent === 'function') {
                trackEvent('price_updated', { newPrice: currentPrice, previousPrice: lastPrice || 'initial' });
                lastPrice = currentPrice;
            }
        }
    }, 500);
});


//
// === PRAKTIJKLOCATIE CHECKBOXES ===
//
document.addEventListener('DOMContentLoaded', function() {
    var hiddenField = document.getElementById('Hidden-PraktijkLocatieKeuzes');
    
    function updateLocatieLijst() {
        var checkboxes = document.querySelectorAll('input[type="checkbox"][id^="PraktijkLocatie-"]');
        
        var selectedLocaties = Array.from(checkboxes)
            .filter(function(cb) { return cb.checked; })
            .map(function(cb) {
                return cb.id.replace('PraktijkLocatie-', '').replace(/([a-z])([A-Z])/g, '$1 $2');
            });
        
        if (hiddenField) {
            hiddenField.value = selectedLocaties.join(', ');
            hiddenField.dispatchEvent(new Event('input', { bubbles: true }));
            hiddenField.dispatchEvent(new Event('change', { bubbles: true }));
            
            if (typeof trackEvent === 'function') {
                trackEvent('praktijklocaties_changed', { count: selectedLocaties.length });
            }
        }
    }
    
    document.addEventListener('change', function(e) {
        if (e.target?.id?.startsWith('PraktijkLocatie-')) updateLocatieLijst();
    });
    
    var resetButton = document.getElementById('Resetbutton-praktijkocaties');
    if (resetButton) {
        resetButton.addEventListener('click', function() {
            setTimeout(updateLocatieLijst, 50);
        });
    }
});


//
// === AIRTABLE ID LOOKUP + PRODUCT OPTIES ===
//
document.addEventListener('DOMContentLoaded', function() {
    var mappingItems = document.querySelectorAll('#airtable-id-mappings [data-item]');
    var openExamItems = document.querySelectorAll('#open-examens-lijst [data-les]');
    
    function getAirtableID(itemName, tabelName) {
        var match = Array.from(mappingItems).find(function(item) {
            return item.getAttribute('data-item') === itemName && 
                   (!tabelName || item.getAttribute('data-tabel') === tabelName);
        });
        return match ? match.getAttribute('data-airtable-id') : '';
    }
    
    function getOpenExamenID(lesType) {
        var match = Array.from(openExamItems).find(function(item) {
            return item.getAttribute('data-les') === lesType && item.getAttribute('data-stad') === 'X-Open';
        });
        return match ? match.getAttribute('data-airtable-id') : '';
    }
    
    function setHiddenField(fieldId, itemName, tabelName) {
        var field = document.getElementById(fieldId);
        if (field && itemName) {
            field.value = getAirtableID(itemName, tabelName);
            field.dispatchEvent(new Event('input', { bubbles: true }));
            field.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
    
    function resetAllHiddenFields() {
        var fieldsToReset = [
            'PrijsTotaal', 'Hidden-PraktijkexamenID', 'Hidden-ExamenID-met-Examendata', 
            'Hidden-AirtableRecordID', 'Hidden-Lessoort', 'Hidden-Bedrijf', 'Hidden-Lesdagnaam', 
            'Hidden-Opleiding', 'Hidden-BedrijfsAirtableID', 'Hidden-OpleidingAirtableID', 
            'Hidden-Product-AirtableID', 'Hidden-PraktijkIndividueel-AirtableID', 
            'Hidden-TheorieVariant-AirtableID', 'Hidden-PraktijkWeekend-AirtableID', 
            'Hidden-Zekerheid-AirtableID'
        ];
        
        fieldsToReset.forEach(function(fieldId) {
            var field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }
    
    // === Product selectie ===
    document.querySelectorAll('input[name="Scooter-Product"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            var productValue = this.value;
            
            if (typeof trackEvent === 'function') {
                trackEvent('product_selected', { product: productValue });
            }
            
            resetAllHiddenFields();
            setHiddenField('Hidden-Product-AirtableID', productValue, 'Producten');
            
            var hiddenBedrijf = document.getElementById('Hidden-Bedrijf');
            var hiddenBedrijfsAirtableID = document.getElementById('Hidden-BedrijfsAirtableID');
            var hiddenOpleiding = document.getElementById('Hidden-Opleiding');
            var hiddenOpleidingAirtableID = document.getElementById('Hidden-OpleidingAirtableID');
            var hiddenExamenID = document.getElementById('Hidden-ExamenID-met-Examendata');
            var hiddenAirtableRecordID = document.getElementById('Hidden-AirtableRecordID');
            
            if (hiddenBedrijf) hiddenBedrijf.value = 'MikScooter';
            if (hiddenBedrijfsAirtableID) hiddenBedrijfsAirtableID.value = getAirtableID('MikScooter', 'Bedrijf');
            if (hiddenOpleiding) hiddenOpleiding.value = 'Bromfiets';
            if (hiddenOpleidingAirtableID) hiddenOpleidingAirtableID.value = getAirtableID('Bromfiets', 'Opleidingen');
            
            if (productValue === 'Scooter-Theorie') {
                if (hiddenAirtableRecordID) {
                    hiddenAirtableRecordID.value = getOpenExamenID('AlleenTheorie');
                    hiddenAirtableRecordID.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (hiddenExamenID) {
                    hiddenExamenID.value = 'Alleen Theorie';
                    hiddenExamenID.dispatchEvent(new Event('change', { bubbles: true }));
                }
            } else if (productValue === 'Scooter-Combi') {
                if (hiddenAirtableRecordID) {
                    hiddenAirtableRecordID.value = getOpenExamenID('Groepsles');
                    hiddenAirtableRecordID.dispatchEvent(new Event('change', { bubbles: true }));
                }
                if (hiddenExamenID) {
                    hiddenExamenID.value = 'Theorie en Praktijk';
                    hiddenExamenID.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    });
    
    // === Theoriekeuze bij Theorie ===
    document.querySelectorAll('input[name="Theoriekeuze---bij-Theorie"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            setHiddenField('Hidden-TheorieVariant-AirtableID', this.value, 'Producttoevoegingen');
            if (typeof trackEvent === 'function') trackEvent('theoriekeuze_theorie', { variant: this.value });
        });
    });
    
    // === Theoriekeuze bij Combi ===
    document.querySelectorAll('input[name="Theoriekeuze---bij-Combi"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            setHiddenField('Hidden-TheorieVariant-AirtableID', this.value, 'Producttoevoegingen');
            if (typeof trackEvent === 'function') trackEvent('theoriekeuze_combi', { variant: this.value });
        });
    });
    
    // === Zekerheid bij Combi ===
    document.querySelectorAll('input[name="Pakket-Zekerheid-bij-Combi"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.value === 'Geen') {
                var field = document.getElementById('Hidden-Zekerheid-AirtableID');
                if (field) field.value = '';
            } else {
                setHiddenField('Hidden-Zekerheid-AirtableID', this.value, 'Producttoevoegingen');
            }
            if (typeof trackEvent === 'function') trackEvent('zekerheid_combi', { keuze: this.value });
        });
    });
    
    // === Zekerheid bij Praktijk ===
    document.querySelectorAll('input[name="Pakket-Zekerheid-bij-Praktijk"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (this.value === 'Geen') {
                var field = document.getElementById('Hidden-Zekerheid-AirtableID');
                if (field) field.value = '';
            } else {
                setHiddenField('Hidden-Zekerheid-AirtableID', this.value, 'Producttoevoegingen');
            }
            if (typeof trackEvent === 'function') trackEvent('zekerheid_praktijk', { keuze: this.value });
        });
    });
    
    // === Lessoort (Individueel) ===
    var lessoortField = document.getElementById('Hidden-Lessoort');
    if (lessoortField) {
        function checkLessoort() {
            if (lessoortField.value === 'Individueel') {
                setHiddenField('Hidden-PraktijkIndividueel-AirtableID', 'Scooter-Praktijk-Individueel', 'Producttoevoegingen');
            } else {
                var field = document.getElementById('Hidden-PraktijkIndividueel-AirtableID');
                if (field) field.value = '';
            }
        }
        lessoortField.addEventListener('input', checkLessoort);
        lessoortField.addEventListener('change', checkLessoort);
        if (lessoortField.value) checkLessoort();
    }
    
    // === Lesdagnaam (Weekend) ===
    var lesdagnaamField = document.getElementById('Hidden-Lesdagnaam');
    if (lesdagnaamField) {
        function checkLesdagnaam() {
            if (lesdagnaamField.value === 'Zaterdag' || lesdagnaamField.value === 'Zondag') {
                setHiddenField('Hidden-PraktijkWeekend-AirtableID', 'Scooter-Praktijk-Weekend', 'Producttoevoegingen');
            } else {
                var field = document.getElementById('Hidden-PraktijkWeekend-AirtableID');
                if (field) field.value = '';
            }
        }
        lesdagnaamField.addEventListener('input', checkLesdagnaam);
        lesdagnaamField.addEventListener('change', checkLesdagnaam);
        if (lesdagnaamField.value) checkLesdagnaam();
    }
});


//
// === STEP TRACKING ===
//
document.addEventListener('DOMContentLoaded', function() {
    var stepContainers = document.querySelectorAll('[id^="step-"]');
    if (stepContainers.length === 0) return;
    
    var currentStep = 'step-01';
    
    var stepObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes') {
                var step = mutation.target;
                var stepId = step.id;
                var isVisible = step.style.display !== 'none' && 
                               step.getAttribute('aria-hidden') !== 'true' && 
                               window.getComputedStyle(step).display !== 'none';
                
                if (isVisible && stepId !== currentStep) {
                    if (typeof trackEvent === 'function') {
                        trackEvent('step_changed', {
                            fromStep: currentStep,
                            toStep: stepId,
                            direction: stepId > currentStep ? 'forward' : 'backward'
                        });
                    }
                    currentStep = stepId;
                }
            }
        });
    });
    
    stepContainers.forEach(function(step) {
        stepObserver.observe(step, { attributes: true, attributeFilter: ['style', 'aria-hidden', 'class'] });
    });
    
    document.addEventListener('click', function(e) {
        var button = e.target.closest('[id*="Next"], [id*="Volgende"], [id*="Previous"], [id*="Vorige"], [id*="Terug"]');
        if (button && typeof trackEvent === 'function') {
            var buttonId = button.id || button.className;
            trackEvent('navigation_button_clicked', {
                buttonId: buttonId,
                direction: (buttonId || '').toLowerCase().includes('next') || (buttonId || '').toLowerCase().includes('volgende') ? 'next' : 'previous',
                currentStep: currentStep
            });
        }
    });
});


//
// === ENHANCED LOGGING - Hidden fields & Navigatie ===
//
(function() {
    var HIDDEN_FIELDS = [
        'Hidden-Bedrijf', 'Hidden-Opleiding', 'Hidden-BedrijfsAirtableID', 'Hidden-OpleidingAirtableID',
        'Hidden-Product-AirtableID', 'Hidden-PraktijkexamenID', 'Hidden-ExamenID-met-Examendata',
        'Hidden-AirtableRecordID', 'Hidden-Lessoort', 'Hidden-Lesdagnaam', 'Hidden-TheorieVariant-AirtableID',
        'Hidden-PraktijkIndividueel-AirtableID', 'Hidden-PraktijkWeekend-AirtableID', 
        'Hidden-Zekerheid-AirtableID', 'PrijsTotaal'
    ];
    
    var previousValues = {};
    var lastAction = null;
    
    function getFieldValue(id) {
        var field = document.getElementById(id);
        return field ? field.value || '' : null;
    }
    
    function getAllFieldValues() {
        var values = {};
        HIDDEN_FIELDS.forEach(function(id) {
            var value = getFieldValue(id);
            values[id] = value === null ? '[NOT_FOUND]' : (value || '[EMPTY]');
        });
        return values;
    }
    
    function track(eventName, data) {
        data = data || {};
        data._timestamp = Date.now();
        data._url = location.href;
        
        console.log('[Log] ' + eventName, data);
        
        if (typeof trackEvent === 'function') trackEvent(eventName, data);
        if (typeof LogRocket !== 'undefined' && LogRocket.track) {
            try { LogRocket.track(eventName, data); } catch (e) {}
        }
    }
    
    function init() {
        // Initiële state opslaan
        HIDDEN_FIELDS.forEach(function(id) {
            previousValues[id] = getFieldValue(id) || '';
        });
        
        track('hidden_fields_initial', {
            fields: getAllFieldValues(),
            empty: HIDDEN_FIELDS.filter(function(f) { return !getFieldValue(f); })
        });
        
        // Monitor field changes
        HIDDEN_FIELDS.forEach(function(id) {
            var field = document.getElementById(id);
            if (!field) return;
            
            ['input', 'change'].forEach(function(eventType) {
                field.addEventListener(eventType, function() {
                    var newValue = this.value || '';
                    var oldValue = previousValues[id] || '';
                    
                    if (newValue !== oldValue) {
                        track('field_changed', {
                            field: id,
                            from: oldValue || '[EMPTY]',
                            to: newValue || '[EMPTY]',
                            trigger: lastAction || 'unknown'
                        });
                        previousValues[id] = newValue;
                    }
                });
            });
        });
        
        // Monitor link clicks
        document.addEventListener('click', function(e) {
            var element = e.target.closest('a[href], button, .w-button, [role="button"], input[type="submit"]');
            if (!element) return;
            
            var href = element.href || element.getAttribute('href');
            var text = (element.textContent || '').trim().substring(0, 30);
            
            lastAction = element.id || text || href || 'click';
            
            if (href && !href.includes('#')) {
                var isExternal = href && !href.includes(location.hostname) && !href.startsWith('/');
                
                track('link_click', {
                    href: href,
                    text: text,
                    type: isExternal ? 'external' : 'internal'
                });
                
                if (!href.includes('examenkiezer')) {
                    track('nav_away', {
                        to: href,
                        fields: getAllFieldValues()
                    });
                }
            }
        }, true);
        
        // Monitor back/forward
        window.addEventListener('popstate', function() {
            track('back_forward', {
                url: location.href,
                fields: getAllFieldValues()
            });
        });
        
        // Monitor page exit
        window.addEventListener('beforeunload', function() {
            track('page_exit', {
                lastAction: lastAction,
                fields: getAllFieldValues()
            });
        });
        
        // Monitor payment buttons
        ['Betalen_MikScooter', 'Betaal-Knop-Activator'].forEach(function(id) {
            var button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', function() {
                    track('pay_click_detail', {
                        btn: id,
                        fields: getAllFieldValues(),
                        empty: HIDDEN_FIELDS.filter(function(f) { return !getFieldValue(f); })
                    });
                });
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(init, 500); });
    } else {
        setTimeout(init, 500);
    }
})();

//
// === FORM ENTER KEY BLOCKING ===
// Voorkomt dat Enter het formulier submit buiten de betaalknop om
// Enter fungeert als Tab naar het volgende zichtbare veld
//
document.addEventListener('DOMContentLoaded', function() {
    var form = document.querySelector('form[data-name="MikScooter-ExamenKiezer"]');
    if (!form) return;
    
    // Helper: check of element zichtbaar is
    function isVisible(el) {
        if (!el) return false;
        if (el.offsetParent === null && window.getComputedStyle(el).position !== 'fixed') return false;
        if (window.getComputedStyle(el).visibility === 'hidden') return false;
        if (window.getComputedStyle(el).display === 'none') return false;
        
        // Check ook parent elementen (voor multi-step forms)
        var parent = el.parentElement;
        while (parent && parent !== document.body) {
            var style = window.getComputedStyle(parent);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            if (parent.getAttribute('aria-hidden') === 'true') return false;
            parent = parent.parentElement;
        }
        return true;
    }
    
    // Helper: krijg alle zichtbare invoervelden
    function getVisibleInputs() {
        var allInputs = form.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea');
        return Array.from(allInputs).filter(function(input) {
            return isVisible(input) && !input.disabled && !input.readOnly;
        });
    }
    
    // Blokkeer Enter op alle input velden
    form.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter') return;
        
        var target = e.target;
        var tagName = target.tagName.toLowerCase();
        
        // Sta Enter toe in textarea (voor multiline tekst)
        if (tagName === 'textarea') return;
        
        // Sta Enter toe op echte submit/betaal buttons
        if (target.id === 'Betalen_MikScooter' || target.id === 'Betaal-Knop-Activator') {
            // Laat de bestaande click handlers hun werk doen
            return;
        }
        
        // Blokkeer Enter voor alle inputs en selects
        if (tagName === 'input' || tagName === 'select') {
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof trackEvent === 'function') {
                trackEvent('enter_as_tab', {
                    fieldName: target.name || target.id,
                    fieldType: target.type
                });
            }
            
            // Ga naar het volgende zichtbare veld
            var visibleInputs = getVisibleInputs();
            var currentIndex = visibleInputs.indexOf(target);
            
            if (currentIndex > -1 && currentIndex < visibleInputs.length - 1) {
                // Ga naar volgende veld
                visibleInputs[currentIndex + 1].focus();
            } else if (currentIndex === visibleInputs.length - 1) {
                // Laatste veld: blur zodat eventuele validatie/PDOK lookup start
                target.blur();
                
                if (typeof trackEvent === 'function') {
                    trackEvent('enter_on_last_field', {
                        fieldName: target.name || target.id
                    });
                }
            }
        }
    });
    
    // Extra beveiliging: blokkeer native form submit
    form.addEventListener('submit', function(e) {
        var activeElement = document.activeElement;
        var isPaymentButton = activeElement && 
            (activeElement.id === 'Betalen_MikScooter' || 
             activeElement.id === 'Betaal-Knop-Activator');
        
        // Check verplichte velden
        var emailField = document.getElementById('E-mail');
        var postcodeField = document.getElementById('Postcode');
        var huisnummerField = document.getElementById('Huisnummer');
        
        var emailValid = emailField && emailField.value && emailField.value.includes('@');
        var postcodeValid = postcodeField && postcodeField.value && postcodeField.value.length >= 6;
        var huisnummerValid = huisnummerField && huisnummerField.value && huisnummerField.value.length > 0;
        
        // Blokkeer ALTIJD tenzij via betaalknop EN alle velden geldig
        if (!isPaymentButton || !emailValid || !postcodeValid || !huisnummerValid) {
            e.preventDefault();
            e.stopPropagation();
            
            if (typeof trackEvent === 'function') {
                trackEvent('form_submit_blocked', {
                    reason: !isPaymentButton ? 'not_payment_button' : 'invalid_fields',
                    emailValid: emailValid,
                    postcodeValid: postcodeValid,
                    huisnummerValid: huisnummerValid
                });
            }
            
            // Toon alleen foutmelding als het via de betaalknop was
            if (isPaymentButton) {
                var invalidFields = [];
                if (!emailValid) invalidFields.push('e-mailadres');
                if (!postcodeValid) invalidFields.push('postcode');
                if (!huisnummerValid) invalidFields.push('huisnummer');
                
                alert('Vul eerst de volgende velden in: ' + invalidFields.join(', '));
                
                if (!emailValid && emailField) emailField.focus();
                else if (!postcodeValid && postcodeField) postcodeField.focus();
                else if (!huisnummerValid && huisnummerField) huisnummerField.focus();
            }
            
            return false;
        }
    });
});

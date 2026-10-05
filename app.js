/**
 * Time Cost Calculator
 * Personal finance tool to convert prices into work hours and days.
 * Features:
 * - Hourly wage: monthly take-home salary / (weekly hours * 52 / 12).
 * - One-time vs monthly subscription work costs.
 * - Wishlist with separate one-time vs monthly subscription totals.
 *   Work hours are always derived from saved price and current salary settings.
 * - "I skipped buying this" button: moves items to Saved History and tracks running total:
 *   "You've saved X hours of work by not buying stuff."
 * - Compare Mode: pick 2-4 wishlist items and display a side-by-side bar chart of work hours.
 * - Downloadable PNG Share Card (via html2canvas) without personal salary details.
 * - Dark / Light mode toggle saved in localStorage.
 * - "Reset all data" with accessible confirmation modal.
 * - Robust localStorage persistence with try/catch.
 * - Old localStorage data with removed fields (commute, tax) is safely ignored.
 */

(() => {
  'use strict';

  const SETTINGS_KEY = 'time_cost_settings_v2';
  const LEGACY_SETTINGS_KEY = 'time_cost_settings_v1';
  const WISHLIST_KEY = 'time_cost_wishlist_v1';
  const SKIPPED_KEY = 'time_cost_skipped_v1';
  const THEME_KEY = 'time_cost_theme';

  // State
  let userSettings = null;
  let wishlist = [];
  let skippedItems = [];
  let selectedCompareIds = new Set();
  let isHistoryOpen = false;
  let isRecurring = false;
  let isInstallment = false;
  let currentTheme = 'dark';

  // DOM Elements - Theme
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');

  // DOM Elements - Screens & Forms
  const setupView = document.getElementById('setupView');
  const mainView = document.getElementById('mainView');
  const setupForm = document.getElementById('setupForm');
  const setupHeading = document.getElementById('setupHeading');
  const setupError = document.getElementById('setupError');
  const saveSalaryBtn = document.getElementById('saveSalaryBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editSalaryBtn = document.getElementById('editSalaryBtn');

  // Setup Form inputs
  const inputMonthlySalary = document.getElementById('monthlySalary');
  const inputWeeklyHours = document.getElementById('weeklyHours');
  const inputWeeklyDays = document.getElementById('weeklyDays');

  // Running Savings Hero Elements
  const savingsRunningHero = document.getElementById('savingsRunningHero');
  const skippedPrimaryText = document.getElementById('skippedPrimaryText');
  const toggleSavedHistoryBtn = document.getElementById('toggleSavedHistoryBtn');
  const skippedCountBadge = document.getElementById('skippedCountBadge');
  const historyChevron = document.getElementById('historyChevron');
  const savedHistoryCard = document.getElementById('savedHistoryCard');
  const savedHistoryList = document.getElementById('savedHistoryList');
  const closeHistoryCardBtn = document.getElementById('closeHistoryCardBtn');

  // Stats Bar elements
  const displaySalary = document.getElementById('displaySalary');
  const displayHourlyWage = document.getElementById('displayHourlyWage');
  const displayWeeklyHours = document.getElementById('displayWeeklyHours');
  const displayWeeklyDays = document.getElementById('displayWeeklyDays');

  // Main Calculator elements
  const productPriceInput = document.getElementById('productPrice');
  const priceInputLabel = document.getElementById('priceInputLabel');
  const currencySuffix = document.getElementById('currencySuffix');
  const clearPriceBtn = document.getElementById('clearPriceBtn');
  const presetChips = document.querySelectorAll('.preset-chip');
  const typeOneTimeBtn = document.getElementById('typeOneTimeBtn');
  const typeInstallmentBtn = document.getElementById('typeInstallmentBtn');
  const typeRecurringBtn = document.getElementById('typeRecurringBtn');
  const installmentTerm = document.getElementById('installmentTerm');
  const installmentMonthsInput = document.getElementById('installmentMonths');

  // Wishlist Save Bar
  const wishlistItemName = document.getElementById('wishlistItemName');
  const saveWishlistBtn = document.getElementById('saveWishlistBtn');
  const saveFeedback = document.getElementById('saveFeedback');

  // Results elements
  const emptyState = document.getElementById('emptyState');
  const resultsGrid = document.getElementById('resultsGrid');
  const summaryBanner = document.getElementById('summaryBanner');
  const summaryText = document.getElementById('summaryText');
  const shareCardBtn = document.getElementById('shareCardBtn');
  const resultHoursBadge = document.getElementById('resultHoursBadge');
  const resultHours = document.getElementById('resultHours');
  const resultHoursDetailed = document.getElementById('resultHoursDetailed');
  const resultDaysBadge = document.getElementById('resultDaysBadge');
  const resultDays = document.getElementById('resultDays');
  const resultDaysDetailed = document.getElementById('resultDaysDetailed');
  const resultPercent = document.getElementById('resultPercent');
  const resultPercentDetailed = document.getElementById('resultPercentDetailed');
  const resultProgressBar = document.getElementById('resultProgressBar');

  // Compare Mode Elements
  const compareBarChartCard = document.getElementById('compareBarChartCard');
  const compareChartBody = document.getElementById('compareChartBody');
  const compareTakeaway = document.getElementById('compareTakeaway');
  const closeCompareChartBtn = document.getElementById('closeCompareChartBtn');
  const compareActionBtn = document.getElementById('compareActionBtn');
  const compareSelectedCount = document.getElementById('compareSelectedCount');
  const comparePromptBar = document.getElementById('comparePromptBar');
  const quickSelectTopBtn = document.getElementById('quickSelectTopBtn');

  // Wishlist Section Elements
  const wishlistTotalHours = document.getElementById('wishlistTotalHours');
  const wishlistTotalBar = document.getElementById('wishlistTotalBar');
  const wishlistOneTimePill = document.getElementById('wishlistOneTimePill');
  const wishlistRecurringPill = document.getElementById('wishlistRecurringPill');
  const wishlistRecurringHours = document.getElementById('wishlistRecurringHours');
  const wishlistOneTimeTotals = document.getElementById('wishlistOneTimeTotals');
  const wishlistRecurringTotals = document.getElementById('wishlistRecurringTotals');
  const wishlistRecurringCount = document.getElementById('wishlistRecurringCount');
  const wishlistRecurringDays = document.getElementById('wishlistRecurringDays');
  const wishlistRecurringCost = document.getElementById('wishlistRecurringCost');
  const wishlistCount = document.getElementById('wishlistCount');
  const wishlistTotalDays = document.getElementById('wishlistTotalDays');
  const wishlistTotalCost = document.getElementById('wishlistTotalCost');
  const wishlistEmpty = document.getElementById('wishlistEmpty');
  const wishlistItemsList = document.getElementById('wishlistItemsList');
  const demoWishlistBtn = document.getElementById('demoWishlistBtn');

  // Reset Modal Elements
  const resetAllDataBtn = document.getElementById('resetAllDataBtn');
  const resetConfirmModal = document.getElementById('resetConfirmModal');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');

  // Share Card Elements
  const shareCardElement = document.getElementById('shareCardElement');
  const shareItemName = document.getElementById('shareItemName');
  const shareItemHours = document.getElementById('shareItemHours');
  const shareMetaDays = document.getElementById('shareMetaDays');
  const shareMetaPrice = document.getElementById('shareMetaPrice');

  /* ==========================================================================
     Theme Management (Saved in localStorage with try/catch)
     ========================================================================== */
  function initTheme() {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') {
        currentTheme = stored;
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        currentTheme = prefersDark ? 'dark' : 'light';
      }
    } catch {
      currentTheme = 'dark';
    }
    applyTheme(currentTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme:', e);
    }
  }

  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  /* ==========================================================================
     Storage Helpers (Wrapped in try/catch)
     ========================================================================== */
  function loadStoredSettings() {
    try {
      let serialized = localStorage.getItem(SETTINGS_KEY);
      if (!serialized) {
        serialized = localStorage.getItem(LEGACY_SETTINGS_KEY);
      }
      if (!serialized) return null;

      const parsed = JSON.parse(serialized);
      // Only require the three core fields; ignore any legacy commute/tax fields
      if (
        parsed &&
        typeof parsed.monthlySalary === 'number' &&
        typeof parsed.weeklyHours === 'number' &&
        typeof parsed.weeklyDays === 'number' &&
        parsed.monthlySalary > 0 &&
        parsed.weeklyHours > 0 &&
        parsed.weeklyDays > 0
      ) {
        return {
          monthlySalary: parsed.monthlySalary,
          weeklyHours: parsed.weeklyHours,
          weeklyDays: parsed.weeklyDays,
          savedRecurring: Boolean(parsed.savedRecurring),
        };
      }
      return null;
    } catch (err) {
      console.warn('Could not read settings from localStorage:', err);
      return null;
    }
  }

  function saveStoredSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Could not save settings to localStorage:', err);
      return false;
    }
  }

  function loadStoredWishlist() {
    try {
      const serialized = localStorage.getItem(WISHLIST_KEY);
      if (!serialized) return [];
      const parsed = JSON.parse(serialized);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Could not load wishlist from localStorage:', err);
      return [];
    }
  }

  function saveStoredWishlist(items) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
      return true;
    } catch (err) {
      console.error('Could not save wishlist to localStorage:', err);
      return false;
    }
  }

  function loadStoredSkipped() {
    try {
      const serialized = localStorage.getItem(SKIPPED_KEY);
      if (!serialized) return [];
      const parsed = JSON.parse(serialized);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn('Could not load skipped items from localStorage:', err);
      return [];
    }
  }

  function saveStoredSkipped(items) {
    try {
      localStorage.setItem(SKIPPED_KEY, JSON.stringify(items));
      return true;
    } catch (err) {
      console.error('Could not save skipped items to localStorage:', err);
      return false;
    }
  }

  /* ==========================================================================
     Wage Math Formula: salary / (weeklyHours * 52 / 12)
     ========================================================================== */
  function getWageData(settings) {
    const monthlyWorkHours = (settings.weeklyHours * 52) / 12;
    const hourlyWage = settings.monthlySalary / monthlyWorkHours;
    const hoursPerDay = settings.weeklyHours / settings.weeklyDays;
    return { monthlyWorkHours, hourlyWage, hoursPerDay };
  }

  function getItemWorkHours(item) {
    if (!userSettings || !item || !(item.price > 0)) return 0;
    const { hourlyWage } = getWageData(userSettings);
    return item.price / hourlyWage;
  }

  function getItemWorkDays(item) {
    if (!userSettings) return 0;
    const { hoursPerDay } = getWageData(userSettings);
    if (!hoursPerDay) return 0;
    return getItemWorkHours(item) / hoursPerDay;
  }

  function formatHoursValue(hours) {
    if (hours < 10) return hours.toFixed(1);
    return Math.round(hours).toLocaleString();
  }

  function recalculateStoredItemHours() {
    if (!userSettings) return;
    wishlist.forEach((item) => {
      item.workHours = getItemWorkHours(item);
    });
    skippedItems.forEach((item) => {
      item.workHours = getItemWorkHours(item);
    });
    saveStoredWishlist(wishlist);
    saveStoredSkipped(skippedItems);
  }

  function formatEGP(amount) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount) + ' EGP';
  }

  function formatTimeDetailed(totalHours) {
    if (totalHours <= 0) return '0 mins';
    const wholeHours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - wholeHours) * 60);
    if (wholeHours === 0) return `${minutes} min${minutes === 1 ? '' : 's'}`;
    if (minutes === 0) return `${wholeHours} hr${wholeHours === 1 ? '' : 's'}`;
    if (minutes === 60) return `${wholeHours + 1} hrs`;
    return `${wholeHours} hr${wholeHours === 1 ? '' : 's'} ${minutes} min${minutes === 1 ? '' : 's'}`;
  }

  function formatDate(isoString) {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  }

  function getDaysAgo(isoString) {
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  }

  /* ==========================================================================
     UI Render & Calculations
     ========================================================================== */
  function renderStatsBar() {
    if (!userSettings) return;
    const { hourlyWage } = getWageData(userSettings);
    displaySalary.textContent = formatEGP(userSettings.monthlySalary);
    displayHourlyWage.textContent = `${hourlyWage.toFixed(2)} EGP/hr`;
    displayWeeklyHours.textContent = `${userSettings.weeklyHours} hrs`;
    displayWeeklyDays.textContent = `${userSettings.weeklyDays} days`;
  }

  function updateProgressBar(percent) {
    const barWidth = Math.min(Math.max(percent, 0), 100);
    resultProgressBar.style.width = `${barWidth}%`;
    if (percent > 100) {
      resultProgressBar.style.backgroundColor = 'var(--accent-rose)';
    } else if (percent > 50) {
      resultProgressBar.style.backgroundColor = 'var(--accent-amber)';
    } else {
      resultProgressBar.style.backgroundColor = 'var(--primary)';
    }
  }

  function calculatePriceImpact() {
    const rawValue = productPriceInput.value.trim();
    const price = parseFloat(rawValue);
    const installmentMonths = Number(installmentMonthsInput.value);
    if (rawValue.length > 0) clearPriceBtn.classList.remove('hidden');
    else clearPriceBtn.classList.add('hidden');
    if (!userSettings || !Number.isFinite(price) || price <= 0 ||
        (isInstallment && (!Number.isInteger(installmentMonths) || installmentMonths < 1 || installmentMonths > 120))) {
      emptyState.classList.remove('hidden'); resultsGrid.classList.add('hidden'); summaryBanner.classList.add('hidden'); return;
    }
    const { hourlyWage, hoursPerDay } = getWageData(userSettings);
    const monthlyPayment = isInstallment ? price / installmentMonths : price;
    const workHours = monthlyPayment / hourlyWage;
    const workDays = workHours / hoursPerDay;
    const totalWorkHours = price / hourlyWage;
    const salaryPercent = (monthlyPayment / userSettings.monthlySalary) * 100;
    const monthlyCost = isRecurring || isInstallment;
    resultHoursBadge.textContent = monthlyCost ? 'Hours / Month' : 'Work Hours';
    resultDaysBadge.textContent = monthlyCost ? 'Days / Month' : 'Work Days';
    resultHours.textContent = workHours < 10 ? workHours.toFixed(1) : Math.round(workHours).toLocaleString();
    resultHoursDetailed.textContent = isInstallment
      ? `≈ ${formatTimeDetailed(workHours)} /mo (${totalWorkHours.toFixed(1)} hrs total)`
      : monthlyCost
        ? `≈ ${formatTimeDetailed(workHours)} /mo`
        : `≈ ${formatTimeDetailed(workHours)}`;
    resultDays.textContent = workDays < 10 ? workDays.toFixed(1) : Math.round(workDays).toLocaleString();
    resultDaysDetailed.textContent = monthlyCost ? `${workDays.toFixed(1)} work days/mo` : `Based on ${hoursPerDay.toFixed(1)}h shift`;
    resultPercent.textContent = salaryPercent >= 100 ? `${salaryPercent.toFixed(0)}%` : `${salaryPercent.toFixed(1)}%`;
    resultPercentDetailed.textContent = monthlyCost ? 'of monthly salary (each month)' : `of ${formatEGP(userSettings.monthlySalary)}`;
    updateProgressBar(salaryPercent);
    if (isInstallment) {
      summaryText.innerHTML = 'Total: <strong>' + formatEGP(price) + '</strong> over ' + installmentMonths + ' months — about <strong>' + formatEGP(monthlyPayment) + '/month</strong>. That is <strong>' + workHours.toFixed(1) + ' work hours/month</strong> and <strong>' + totalWorkHours.toFixed(1) + ' work hours total</strong>.';
    } else if (isRecurring) {
      summaryText.innerHTML = 'Subscription: <strong>' + workHours.toFixed(1) + ' hrs/month</strong> (' + workDays.toFixed(1) + ' work days/month).';
    } else {
      summaryText.innerHTML = `You'd need to work <strong>${workHours >= 1 ? workHours.toFixed(1) + ' hours' : formatTimeDetailed(workHours)}</strong> — that's ${workDays.toFixed(1)} work days (${salaryPercent.toFixed(1)}% of your monthly salary).`;
    }
    emptyState.classList.add('hidden'); resultsGrid.classList.remove('hidden'); summaryBanner.classList.remove('hidden');
  }

  function setCostType(type) {
    isRecurring = type === 'recurring';
    isInstallment = type === 'installment';
    typeOneTimeBtn.classList.toggle('active', type === 'onetime');
    typeInstallmentBtn.classList.toggle('active', isInstallment);
    typeRecurringBtn.classList.toggle('active', isRecurring);
    installmentTerm.classList.toggle('hidden', !isInstallment);
    if (isRecurring) {
      priceInputLabel.textContent = 'Monthly Subscription Cost'; currencySuffix.textContent = '/mo'; currencySuffix.classList.remove('hidden');
    } else if (isInstallment) {
      priceInputLabel.textContent = 'Total Amount (Including Fees)'; currencySuffix.textContent = 'total'; currencySuffix.classList.remove('hidden');
    } else {
      priceInputLabel.textContent = 'Product Price'; currencySuffix.classList.add('hidden');
    }
    if (userSettings) { userSettings.savedRecurring = isRecurring; saveStoredSettings(userSettings); }
    calculatePriceImpact();
  }

  /* ==========================================================================
     Share Card Generation (html2canvas) - No Salary Data
     ========================================================================== */
  async function handleShareCard() {
    const rawValue = productPriceInput.value.trim();
    const price = parseFloat(rawValue);

    const installmentMonths = Number(installmentMonthsInput.value);
    if (!userSettings || !Number.isFinite(price) || price <= 0 ||
        (isInstallment && (!Number.isInteger(installmentMonths) || installmentMonths < 1 || installmentMonths > 120))) {
      showSaveFeedback('Enter a valid price and payment period before sharing.', 'error');
      productPriceInput.focus();
      return;
    }

    const { hourlyWage, hoursPerDay } = getWageData(userSettings);
    const workHours = price / hourlyWage;
    const workDays = workHours / hoursPerDay;

    const rawName = wishlistItemName.value.trim();
    const itemName = rawName.length > 0 ? rawName : 'This Purchase';

    // Populate share card (NOTE: NO SALARY INFO)
    shareItemName.textContent = itemName;
    const shareHours = workHours < 10 ? workHours.toFixed(1) : Math.round(workHours).toLocaleString();
    shareItemHours.textContent = shareHours + ' hours' + (isRecurring ? ' / month' : isInstallment ? ' total' : '');
    shareMetaDays.textContent = workDays.toFixed(1) + ' work days' + (isRecurring ? ' / month' : isInstallment ? ' total' : '');
    shareMetaPrice.textContent = formatEGP(price) + (isRecurring ? '/mo' : isInstallment ? ' total · ' + installmentMonths + ' months' : '');

    const originalText = shareCardBtn.innerHTML;
    shareCardBtn.disabled = true;
    shareCardBtn.innerHTML = `<span>⏳ Generating image...</span>`;

    try {
      if (typeof window.html2canvas !== 'function') {
        throw new Error('html2canvas library is loading or blocked.');
      }

      const canvas = await window.html2canvas(shareCardElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0d121f',
        logging: false,
      });

      const imageURI = canvas.toDataURL('image/png');
      const safeSlug = itemName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
      const fileName = `time-cost-${safeSlug}-${Math.round(workHours)}h.png`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = imageURI;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      shareCardBtn.innerHTML = `<span>✓ PNG Downloaded!</span>`;
      setTimeout(() => {
        shareCardBtn.innerHTML = originalText;
        shareCardBtn.disabled = false;
      }, 2500);

    } catch (err) {
      console.error('Share generation error:', err);
      showSaveFeedback('Could not generate PNG card. Please try again.', 'error');
      shareCardBtn.innerHTML = originalText;
      shareCardBtn.disabled = false;
    }
  }

  /* ==========================================================================
     Running Savings & Skipped History
     ========================================================================== */
  function renderSavingsRunningHero() {
    skippedCountBadge.textContent = skippedItems.length;

    if (skippedItems.length === 0) {
      savingsRunningHero.classList.add('hidden');
      savedHistoryCard.classList.add('hidden');
      return;
    }

    savingsRunningHero.classList.remove('hidden');

    const oneTime = skippedItems.filter((item) => !item.isRecurring);
    const recurring = skippedItems.filter((item) => item.isRecurring);
    const oneTimeHours = oneTime.reduce((acc, item) => acc + getItemWorkHours(item), 0);
    const oneTimeMoney = oneTime.reduce((acc, item) => acc + (item.price || 0), 0);
    const recHours = recurring.reduce((acc, item) => acc + getItemWorkHours(item), 0);
    const recMoney = recurring.reduce((acc, item) => acc + (item.price || 0), 0);
    const oneTimeDays = oneTime.reduce((acc, item) => acc + getItemWorkDays(item), 0);
    const recDays = recurring.reduce((acc, item) => acc + getItemWorkDays(item), 0);

    if (oneTime.length && recurring.length) {
      skippedPrimaryText.innerHTML = `You've saved <strong>${formatHoursValue(oneTimeHours)}</strong> hours on skipped one-time purchases, plus <strong>${formatHoursValue(recHours)} hrs/mo</strong> on skipped subscriptions.`;
      skippedDetailsSubtitle.innerHTML = `That's <span>${oneTimeDays.toFixed(1)} days</span> and <span>${formatEGP(oneTimeMoney)}</span> kept from one-time items, and <span>${recDays.toFixed(1)} days/mo</span> &amp; <span>${formatEGP(recMoney)}/mo</span> from subscriptions.`;
    } else if (recurring.length) {
      skippedPrimaryText.innerHTML = `You've saved <strong>${formatHoursValue(recHours)} hrs/mo</strong> of work by skipping subscriptions.`;
      skippedDetailsSubtitle.innerHTML = `That's <span>${recDays.toFixed(1)} days/mo</span> of freedom &amp; <span>${formatEGP(recMoney)}/mo</span> kept in your pocket each month.`;
    } else {
      skippedPrimaryText.innerHTML = `You've saved <strong>${formatHoursValue(oneTimeHours)}</strong> hours of work by not buying stuff.`;
      skippedDetailsSubtitle.innerHTML = `That's <span>${oneTimeDays.toFixed(1)} days</span> of freedom &amp; <span>${formatEGP(oneTimeMoney)}</span> kept in your pocket!`;
    }

    renderSavedHistoryList();
  }

  function renderSavedHistoryList() {
    if (!savedHistoryList) return;

    if (skippedItems.length === 0) {
      savedHistoryList.innerHTML = '<p class="field-hint" style="text-align: center; padding: 12px;">No items skipped yet.</p>';
      return;
    }

    savedHistoryList.innerHTML = '';

    skippedItems.forEach((item) => {
      const itemRow = document.createElement('div');
      itemRow.className = 'history-item';
      itemRow.setAttribute('data-id', item.id);

      const formattedPrice = formatEGP(item.price) + (item.isRecurring ? '/mo' : item.isInstallment ? ' total' : '');
      const skippedDate = item.dateSkipped ? formatDate(item.dateSkipped) : 'Recently';
      const liveHours = getItemWorkHours(item);
      const hoursLabel = item.isRecurring ? 'hrs/mo' : 'hrs';

      itemRow.innerHTML = `
        <div class="history-item-left">
          <span class="history-item-title">${escapeHTML(item.name)}</span>
          <div class="history-item-meta">
            <span>${formattedPrice}</span>
            ${(item.isInstallment && item.installmentMonths > 0 ? '<span>•</span><span>' + item.installmentMonths + ' months</span>' : '')}
            <span>•</span>
            <span>Skipped ${skippedDate}</span>
          </div>
        </div>
        <div class="history-item-right">
          <div class="history-savings-badge">
            <span class="history-saved-hours">+${liveHours.toFixed(1)} ${hoursLabel}</span>
          </div>
          <button type="button" class="btn-restore-item" data-id="${item.id}" title="Move back to wishlist">Restore</button>
          <button type="button" class="btn-delete-history" data-id="${item.id}" aria-label="Delete history item">✕</button>
        </div>
      `;

      savedHistoryList.appendChild(itemRow);
    });
  }

  function handleSkipWishlistItem(id) {
    const itemIndex = wishlist.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    const [skipped] = wishlist.splice(itemIndex, 1);
    skipped.dateSkipped = new Date().toISOString();
    selectedCompareIds.delete(id);

    skippedItems.unshift(skipped);
    saveStoredWishlist(wishlist);
    saveStoredSkipped(skippedItems);

    renderWishlist();
    renderSavingsRunningHero();
    updateCompareState();

    const skippedHours = getItemWorkHours(skipped);
    const skippedUnit = skipped.isRecurring ? 'hrs/mo' : 'hours';
    showSaveFeedback(`🎉 Awesome! You saved ${skippedHours.toFixed(1)} ${skippedUnit} of work by skipping "${skipped.name}".`, 'success');
  }

  function handleRestoreSkippedItem(id) {
    const itemIndex = skippedItems.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    const [restored] = skippedItems.splice(itemIndex, 1);
    delete restored.dateSkipped;

    wishlist.unshift(restored);
    saveStoredWishlist(wishlist);
    saveStoredSkipped(skippedItems);

    renderWishlist();
    renderSavingsRunningHero();
    updateCompareState();

    showSaveFeedback(`"${restored.name}" restored back to your wishlist.`, 'success');
  }

  function handleDeleteSkippedItem(id) {
    skippedItems = skippedItems.filter((item) => item.id !== id);
    saveStoredSkipped(skippedItems);
    renderSavingsRunningHero();
  }

  function toggleSavedHistoryCard() {
    isHistoryOpen = !isHistoryOpen;
    savedHistoryCard.classList.toggle('hidden', !isHistoryOpen);
    historyChevron.classList.toggle('rotated', isHistoryOpen);
    if (isHistoryOpen) {
      savedHistoryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /* ==========================================================================
     Compare Mode (Bar Chart)
     ========================================================================== */
  function updateCompareState() {
    const validIds = new Set(wishlist.map(i => i.id));
    for (const id of selectedCompareIds) {
      if (!validIds.has(id)) selectedCompareIds.delete(id);
    }

    const count = selectedCompareIds.size;
    compareSelectedCount.textContent = count;

    if (wishlist.length >= 2) {
      comparePromptBar.classList.remove('hidden');
    } else {
      comparePromptBar.classList.add('hidden');
    }

    if (count >= 2) {
      compareActionBtn.classList.remove('hidden');
      if (!compareBarChartCard.classList.contains('hidden')) {
        renderCompareChart();
      }
    } else {
      compareActionBtn.classList.add('hidden');
      if (count === 0) compareBarChartCard.classList.add('hidden');
    }
  }

  function renderCompareChart() {
    const selectedItems = wishlist.filter(item => selectedCompareIds.has(item.id));
    if (selectedItems.length < 2) {
      compareBarChartCard.classList.add('hidden');
      return;
    }

    compareBarChartCard.classList.remove('hidden');
    compareChartBody.innerHTML = '';

    const itemsToCompare = selectedItems.slice(0, 4);
    compareChartBody.style.gridTemplateColumns = `repeat(${itemsToCompare.length}, 1fr)`;

    const liveHoursList = itemsToCompare.map((item) => getItemWorkHours(item));
    const maxHours = Math.max(...liveHoursList, 0.1);

    itemsToCompare.forEach((item, index) => {
      const col = document.createElement('div');
      col.className = 'chart-column';

      const liveHours = liveHoursList[index];
      const heightPercent = Math.max(14, Math.round((liveHours / maxHours) * 100));
      const colorClass = `bar-color-${index % 4}`;
      const days = getItemWorkDays(item).toFixed(1);
      const hoursSuffix = item.isRecurring ? 'h/mo' : 'h';
      const daysSuffix = item.isRecurring ? ' work days/mo' : ' work days';

      col.innerHTML = `
        <div class="chart-bar-track">
          <div class="chart-bar-fill ${colorClass}" style="height: ${heightPercent}%;">
            <span class="chart-bar-hours">${liveHours.toFixed(1)}${hoursSuffix}</span>
          </div>
        </div>
        <div class="chart-column-info">
          <span class="chart-item-name" title="${escapeHTML(item.name)}">${escapeHTML(item.name)}</span>
          <span class="chart-item-price">${formatEGP(item.price)}${item.isRecurring ? '/mo' : ''}</span>
          <span class="chart-item-days">${days}${daysSuffix}</span>
        </div>
      `;

      compareChartBody.appendChild(col);
    });

    const sorted = itemsToCompare
      .map((item, index) => ({ item, hours: liveHoursList[index] }))
      .sort((a, b) => b.hours - a.hours);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    const allRecurring = itemsToCompare.every((item) => item.isRecurring);
    const allOneTime = itemsToCompare.every((item) => !item.isRecurring);
    const unitPhrase = allRecurring ? 'work-hours per month' : 'work-hours';

    if (!allRecurring && !allOneTime) {
      compareTakeaway.innerHTML = `Bars mix one-time hours with subscription hours per month, so they are not the same unit. <strong>${escapeHTML(highest.item.name)}</strong> is the tallest bar at <strong>${highest.hours.toFixed(1)}${highest.item.isRecurring ? 'h/mo' : 'h'}</strong>.`;
    } else if (highest.hours > lowest.hours) {
      const ratio = (highest.hours / Math.max(lowest.hours, 0.01)).toFixed(1);
      const diffHours = (highest.hours - lowest.hours).toFixed(1);
      compareTakeaway.innerHTML = `<strong>${escapeHTML(highest.item.name)}</strong> requires <strong>${ratio}× more ${unitPhrase}</strong> than <strong>${escapeHTML(lowest.item.name)}</strong> (+${diffHours} additional hours${allRecurring ? '/mo' : ''} of your life).`;
    } else {
      compareTakeaway.innerHTML = `All selected items require equal work effort of <strong>${highest.hours.toFixed(1)} hours${allRecurring ? '/mo' : ''}</strong>.`;
    }

    compareBarChartCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleQuickSelectTop() {
    selectedCompareIds.clear();
    wishlist.slice(0, 2).forEach(item => selectedCompareIds.add(item.id));
    renderWishlist();
    updateCompareState();
    renderCompareChart();
  }

  /* ==========================================================================
     Wishlist Functions
     ========================================================================== */
  function renderWishlist() {
    if (!wishlist || wishlist.length === 0) {
      wishlistEmpty.classList.remove('hidden');
      wishlistItemsList.classList.add('hidden');
      wishlistTotalBar.classList.add('hidden');
      comparePromptBar.classList.add('hidden');
      compareActionBtn.classList.add('hidden');
      compareBarChartCard.classList.add('hidden');
      wishlistOneTimePill.classList.remove('hidden');
      wishlistRecurringPill.classList.add('hidden');
      wishlistTotalHours.textContent = '0.0 hrs';
      return;
    }

    wishlistEmpty.classList.add('hidden');
    wishlistItemsList.classList.remove('hidden');
    wishlistTotalBar.classList.remove('hidden');

    wishlistItemsList.innerHTML = '';

    wishlist.forEach((item) => {
      const liveHours = getItemWorkHours(item);
      const liveDays = getItemWorkDays(item);
      const daysAgo = getDaysAgo(item.dateAdded);
      const isCoolOff = daysAgo >= 7;
      const isSelected = selectedCompareIds.has(item.id);

      const itemCard = document.createElement('div');
      itemCard.className = `wishlist-item ${isCoolOff ? 'cool-off-highlight' : ''} ${isSelected ? 'selected-for-compare' : ''}`;
      itemCard.setAttribute('data-id', item.id);

      const typeBadge = item.isRecurring
        ? '<span class="item-recurring-tag">🔄 Subscription</span>'
        : item.isInstallment ? '<span class="item-recurring-tag">💳 Installments</span>' : '';
      const formattedPrice = formatEGP(item.price) + (item.isRecurring ? '/mo' : item.isInstallment ? ' total' : '');
      const formattedHours = liveHours.toFixed(1) + (item.isRecurring ? ' hrs/mo' : ' hrs');
      const formattedDays = userSettings
        ? liveDays.toFixed(1) + (item.isRecurring ? ' work days/mo' : ' work days')
        : '';

      let coolOffHTML = '';
      if (isCoolOff) {
        const coolOffHours = item.isRecurring
          ? `${liveHours.toFixed(1)} hours/month of your life`
          : `${liveHours.toFixed(1)} hours of your life`;
        coolOffHTML = `
          <div class="cool-off-alert-box">
            <span class="cool-off-icon">⏳</span>
            <div class="cool-off-text-wrap">
              <span class="cool-off-headline">Still want it? That's ${coolOffHours}.</span>
              <span class="cool-off-sub">On wishlist for ${daysAgo} days — cool-off period reached!</span>
            </div>
          </div>
        `;
      }

      itemCard.innerHTML = `
        ${coolOffHTML}
        <div class="wishlist-item-main">
          <div class="item-info">
            <div class="wishlist-item-title-row">
              <h3 class="wishlist-item-title">${escapeHTML(item.name)} ${typeBadge}</h3>
            </div>
            <div class="wishlist-item-meta">
              <span class="item-price">${formattedPrice}</span>
              ${(item.isInstallment && item.installmentMonths > 0 ? '<span>•</span><span>' + item.installmentMonths + ' months (~' + formatEGP(item.price / item.installmentMonths) + '/mo)</span>' : '')}
              <span>•</span>
              <span class="item-date">Added ${formatDate(item.dateAdded)} (${daysAgo === 0 ? 'today' : daysAgo + 'd ago'})</span>
            </div>
          </div>
          <div class="item-hours-badge">
            <span class="item-hours-val">${formattedHours}</span>
            <span class="item-days-val">${formattedDays}</span>
          </div>
        </div>
        <div class="wishlist-item-actions">
          <div class="actions-left">
            <label class="compare-check-label" title="Select to compare 2-4 items in bar chart">
              <input type="checkbox" class="item-compare-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
              <span>Compare</span>
            </label>
            <button type="button" class="btn-skip-item" data-id="${item.id}" title="Celebrate not buying this item!">
              <span>🎉 I skipped buying this</span>
            </button>
          </div>
          <div class="actions-right">
            ${!isCoolOff ? `<button type="button" class="btn-simulate-cooloff" data-id="${item.id}" title="Test the 7+ days cool-off highlight">Simulate 7d cool-off</button>` : ''}
            <button type="button" class="btn-delete-item" data-id="${item.id}" aria-label="Delete item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete</span>
            </button>
          </div>
        </div>
      `;

      wishlistItemsList.appendChild(itemCard);
    });

    const oneTimeItems = wishlist.filter((item) => !item.isRecurring);
    const recurringItems = wishlist.filter((item) => item.isRecurring);

    const oneTimeHours = oneTimeItems.reduce((acc, item) => acc + getItemWorkHours(item), 0);
    const oneTimeDays = oneTimeItems.reduce((acc, item) => acc + getItemWorkDays(item), 0);
    const oneTimeCost = oneTimeItems.reduce((acc, item) => acc + (item.price || 0), 0);
    const recHours = recurringItems.reduce((acc, item) => acc + getItemWorkHours(item), 0);
    const recDays = recurringItems.reduce((acc, item) => acc + getItemWorkDays(item), 0);
    const recCost = recurringItems.reduce((acc, item) => acc + (item.price || 0), 0);

    wishlistOneTimePill.classList.toggle('hidden', oneTimeItems.length === 0);
    wishlistRecurringPill.classList.toggle('hidden', recurringItems.length === 0);
    wishlistOneTimeTotals.classList.toggle('hidden', oneTimeItems.length === 0);
    wishlistRecurringTotals.classList.toggle('hidden', recurringItems.length === 0);

    wishlistTotalHours.textContent = `${oneTimeHours.toFixed(1)} hrs`;
    wishlistCount.textContent = oneTimeItems.length;
    wishlistTotalDays.textContent = `${oneTimeDays.toFixed(1)} days`;
    wishlistTotalCost.textContent = formatEGP(oneTimeCost);

    wishlistRecurringHours.textContent = `${recHours.toFixed(1)} hrs/mo`;
    wishlistRecurringCount.textContent = recurringItems.length;
    wishlistRecurringDays.textContent = `${recDays.toFixed(1)} days/mo`;
    wishlistRecurringCost.textContent = formatEGP(recCost) + '/mo';

    updateCompareState();
  }

  function handleSaveToWishlist() {
    const rawPrice = productPriceInput.value.trim();
    const price = parseFloat(rawPrice);

    const installmentMonths = Number(installmentMonthsInput.value);
    if (!Number.isFinite(price) || price <= 0 ||
        (isInstallment && (!Number.isInteger(installmentMonths) || installmentMonths < 1 || installmentMonths > 120))) {
      showSaveFeedback(isInstallment ? 'Enter a valid total price and payment period before saving.' : 'Please enter a product price above before saving.', 'error');
      productPriceInput.focus();
      return;
    }

    if (!userSettings) {
      showSaveFeedback('Please complete your salary setup first.', 'error');
      return;
    }

    const { hourlyWage } = getWageData(userSettings);
    const workHours = price / hourlyWage;

    const rawName = wishlistItemName.value.trim();
    const itemName = rawName.length > 0
      ? rawName
      : 'Item (' + formatEGP(price) + (isRecurring ? '/mo' : isInstallment ? ' total' : '') + ')';

    const newItem = {
      id: Date.now().toString(),
      name: itemName,
      price: price,
      dateAdded: new Date().toISOString(),
      workHours: workHours,
      isRecurring: isRecurring,
      isInstallment: isInstallment,
      installmentMonths: isInstallment ? installmentMonths : null,
    };

    wishlist.unshift(newItem);
    saveStoredWishlist(wishlist);
    renderWishlist();

    showSaveFeedback(`"${itemName}" saved to your wishlist!`, 'success');
    wishlistItemName.value = '';

    wishlistSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function handleDeleteWishlistItem(id) {
    wishlist = wishlist.filter((item) => item.id !== id);
    selectedCompareIds.delete(id);
    saveStoredWishlist(wishlist);
    renderWishlist();
  }

  function handleSimulateCoolOff(id) {
    const target = wishlist.find((item) => item.id === id);
    if (target) {
      target.dateAdded = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      saveStoredWishlist(wishlist);
      renderWishlist();
    }
  }

  function handleAddDemoItem() {
    if (!userSettings) return;

    const { hourlyWage } = getWageData(userSettings);
    const now = Date.now();

    const demoItems = [
      {
        id: (now + 1).toString(),
        name: 'iPhone 15 Pro',
        price: 49500,
        dateAdded: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
        workHours: 49500 / hourlyWage,
        isRecurring: false,
      },
      {
        id: (now + 2).toString(),
        name: 'Sony Wireless Headphones',
        price: 9200,
        dateAdded: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        workHours: 9200 / hourlyWage,
        isRecurring: false,
      },
      {
        id: (now + 3).toString(),
        name: 'Espresso Machine',
        price: 14800,
        dateAdded: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        workHours: 14800 / hourlyWage,
        isRecurring: false,
      },
    ];

    wishlist.push(...demoItems);
    saveStoredWishlist(wishlist);

    selectedCompareIds.add(demoItems[0].id);
    selectedCompareIds.add(demoItems[1].id);

    renderWishlist();
    renderCompareChart();
  }

  function showSaveFeedback(message, type) {
    saveFeedback.textContent = message;
    saveFeedback.className = `save-feedback ${type}`;
    saveFeedback.classList.remove('hidden');
    setTimeout(() => { saveFeedback.classList.add('hidden'); }, 3500);
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     Reset All Data Functionality
     ========================================================================== */
  function openResetModal() { resetConfirmModal.classList.remove('hidden'); }
  function closeResetModal() { resetConfirmModal.classList.add('hidden'); }

  function handleConfirmReset() {
    try {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(LEGACY_SETTINGS_KEY);
      localStorage.removeItem(WISHLIST_KEY);
      localStorage.removeItem(SKIPPED_KEY);
      // Theme preference is kept intentionally
    } catch (e) {
      console.warn('Error clearing localStorage:', e);
    }

    userSettings = null;
    wishlist = [];
    skippedItems = [];
    selectedCompareIds.clear();
    isHistoryOpen = false;

    closeResetModal();
    showSetupView(false);

    productPriceInput.value = '';
    wishlistItemName.value = '';
    renderSavingsRunningHero();
    renderWishlist();

    showSaveFeedback('All data has been reset successfully.', 'success');
  }

  /* ==========================================================================
     Screen Switching & Setup Form
     ========================================================================== */
  function showSetupView(isEditing = false) {
    setupError.classList.add('hidden');
    setupError.textContent = '';

    if (isEditing && userSettings) {
      setupHeading.textContent = 'Edit Salary & Work Hours';
      saveSalaryBtn.textContent = 'Update Settings';
      cancelEditBtn.classList.remove('hidden');
      inputMonthlySalary.value = userSettings.monthlySalary;
      inputWeeklyHours.value = userSettings.weeklyHours;
      inputWeeklyDays.value = userSettings.weeklyDays;
    } else {
      setupHeading.textContent = 'Salary & Work Hours Setup';
      saveSalaryBtn.textContent = 'Save & Continue';
      cancelEditBtn.classList.add('hidden');
      inputMonthlySalary.value = '';
      inputWeeklyHours.value = '40';
      inputWeeklyDays.value = '5';
    }

    setupView.classList.remove('hidden');
    mainView.classList.add('hidden');
    editSalaryBtn.classList.add('hidden');
    inputMonthlySalary.focus();
  }

  function showMainView() {
    setupView.classList.add('hidden');
    mainView.classList.remove('hidden');
    editSalaryBtn.classList.remove('hidden');

    renderStatsBar();
    calculatePriceImpact();
    renderSavingsRunningHero();
    renderWishlist();

    setTimeout(() => { productPriceInput.focus(); }, 50);
  }

  /* ==========================================================================
     Event Listeners
     ========================================================================== */
  themeToggleBtn.addEventListener('click', toggleTheme);

  setupForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const salary = parseFloat(inputMonthlySalary.value);
    const hours = parseFloat(inputWeeklyHours.value);
    const days = parseFloat(inputWeeklyDays.value);

    if (isNaN(salary) || salary <= 0) {
      setupError.textContent = 'Please enter a valid monthly salary greater than 0.';
      setupError.classList.remove('hidden');
      inputMonthlySalary.focus();
      return;
    }

    if (isNaN(hours) || hours <= 0 || hours > 168) {
      setupError.textContent = 'Weekly hours must be between 1 and 168.';
      setupError.classList.remove('hidden');
      inputWeeklyHours.focus();
      return;
    }

    if (isNaN(days) || days <= 0 || days > 7) {
      setupError.textContent = 'Working days per week must be between 1 and 7.';
      setupError.classList.remove('hidden');
      inputWeeklyDays.focus();
      return;
    }

    const newSettings = {
      monthlySalary: salary,
      weeklyHours: hours,
      weeklyDays: days,
      savedRecurring: isRecurring,
    };

    saveStoredSettings(newSettings);
    userSettings = newSettings;
    recalculateStoredItemHours();
    showMainView();
  });

  cancelEditBtn.addEventListener('click', () => {
    if (userSettings) showMainView();
  });

  editSalaryBtn.addEventListener('click', () => { showSetupView(true); });

  productPriceInput.addEventListener('input', calculatePriceImpact);

  clearPriceBtn.addEventListener('click', () => {
    productPriceInput.value = '';
    calculatePriceImpact();
    productPriceInput.focus();
  });

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const amount = chip.getAttribute('data-amount');
      if (amount) {
        productPriceInput.value = amount;
        calculatePriceImpact();
      }
    });
  });

  typeOneTimeBtn.addEventListener('click', () => { setCostType('onetime'); });
  typeInstallmentBtn.addEventListener('click', () => { setCostType('installment'); });
  typeRecurringBtn.addEventListener('click', () => { setCostType('recurring'); });
  installmentMonthsInput.addEventListener('input', calculatePriceImpact);

  saveWishlistBtn.addEventListener('click', handleSaveToWishlist);

  wishlistItemName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveToWishlist();
    }
  });

  demoWishlistBtn.addEventListener('click', handleAddDemoItem);

  shareCardBtn.addEventListener('click', handleShareCard);

  toggleSavedHistoryBtn.addEventListener('click', toggleSavedHistoryCard);
  closeHistoryCardBtn.addEventListener('click', toggleSavedHistoryCard);

  compareActionBtn.addEventListener('click', renderCompareChart);

  closeCompareChartBtn.addEventListener('click', () => {
    compareBarChartCard.classList.add('hidden');
  });

  quickSelectTopBtn.addEventListener('click', handleQuickSelectTop);

  // Wishlist Actions Delegation
  wishlistItemsList.addEventListener('click', (e) => {
    const deleteBtn = e.target.closest('.btn-delete-item');
    if (deleteBtn) { handleDeleteWishlistItem(deleteBtn.getAttribute('data-id')); return; }

    const cooloffBtn = e.target.closest('.btn-simulate-cooloff');
    if (cooloffBtn) { handleSimulateCoolOff(cooloffBtn.getAttribute('data-id')); return; }

    const skipBtn = e.target.closest('.btn-skip-item');
    if (skipBtn) { handleSkipWishlistItem(skipBtn.getAttribute('data-id')); return; }
  });

  wishlistItemsList.addEventListener('change', (e) => {
    const checkbox = e.target.closest('.item-compare-checkbox');
    if (!checkbox) return;

    const id = checkbox.getAttribute('data-id');
    if (!id) return;

    if (checkbox.checked) {
      if (selectedCompareIds.size >= 4) {
        checkbox.checked = false;
        showSaveFeedback('You can compare a maximum of 4 items at once.', 'error');
        return;
      }
      selectedCompareIds.add(id);
    } else {
      selectedCompareIds.delete(id);
    }

    const card = checkbox.closest('.wishlist-item');
    if (card) card.classList.toggle('selected-for-compare', checkbox.checked);

    updateCompareState();
  });

  // Saved History Actions Delegation
  savedHistoryList.addEventListener('click', (e) => {
    const restoreBtn = e.target.closest('.btn-restore-item');
    if (restoreBtn) { handleRestoreSkippedItem(restoreBtn.getAttribute('data-id')); return; }

    const deleteBtn = e.target.closest('.btn-delete-history');
    if (deleteBtn) { handleDeleteSkippedItem(deleteBtn.getAttribute('data-id')); return; }
  });

  // Reset Data Modal
  resetAllDataBtn.addEventListener('click', openResetModal);
  cancelResetBtn.addEventListener('click', closeResetModal);
  confirmResetBtn.addEventListener('click', handleConfirmReset);

  resetConfirmModal.addEventListener('click', (e) => {
    if (e.target === resetConfirmModal) closeResetModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !resetConfirmModal.classList.contains('hidden')) closeResetModal();
  });

  /* ==========================================================================
     Initialization
     ========================================================================== */
  function init() {
    initTheme();

    userSettings = loadStoredSettings();
    wishlist = loadStoredWishlist();
    skippedItems = loadStoredSkipped();

    if (userSettings) {
      isRecurring = Boolean(userSettings.savedRecurring);
      recalculateStoredItemHours();
      setCostType(isRecurring ? 'recurring' : 'onetime');
      showMainView();
    } else {
      isRecurring = false;
      showSetupView(false);
    }
  }

  // Need reference to wishlistSection for scrollIntoView in handleSaveToWishlist
  const wishlistSection = document.getElementById('wishlistSection');

  init();
})();

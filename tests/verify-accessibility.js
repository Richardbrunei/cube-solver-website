/**
 * Accessibility Verification Script
 * Run this in the browser console to verify all accessibility features
 */

function verifyAccessibility() {
    console.log('🔍 Starting Accessibility Verification...\n');
    
    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };
    
    function test(name, condition, details = '') {
        const passed = condition;
        results.tests.push({ name, passed, details });
        if (passed) {
            results.passed++;
            console.log(`✅ PASS: ${name}`);
            if (details) console.log(`   ${details}`);
        } else {
            results.failed++;
            console.error(`❌ FAIL: ${name}`);
            if (details) console.error(`   ${details}`);
        }
    }
    
    // Test 1: Palette exists and has proper role
    const palette = document.getElementById('color-palette');
    test(
        'Palette has role="toolbar"',
        palette && palette.getAttribute('role') === 'toolbar',
        palette ? `Found: role="${palette.getAttribute('role')}"` : 'Palette not found'
    );
    
    // Test 2: Palette has aria-label
    test(
        'Palette has aria-label',
        palette && palette.hasAttribute('aria-label'),
        palette ? `Label: "${palette.getAttribute('aria-label')}"` : 'Palette not found'
    );
    
    // Test 3: Color buttons container has proper role
    const colorsContainer = document.querySelector('.color-palette__colors');
    test(
        'Colors container has role="group"',
        colorsContainer && colorsContainer.getAttribute('role') === 'group',
        colorsContainer ? `Found: role="${colorsContainer.getAttribute('role')}"` : 'Container not found'
    );
    
    // Test 4: All color buttons have aria-pressed
    const colorButtons = document.querySelectorAll('.color-palette__color-btn');
    const allHaveAriaPressed = Array.from(colorButtons).every(btn => btn.hasAttribute('aria-pressed'));
    test(
        'All color buttons have aria-pressed',
        colorButtons.length > 0 && allHaveAriaPressed,
        `Found ${colorButtons.length} buttons, all have aria-pressed: ${allHaveAriaPressed}`
    );
    
    // Test 5: All color buttons have aria-label
    const allHaveAriaLabel = Array.from(colorButtons).every(btn => btn.hasAttribute('aria-label'));
    test(
        'All color buttons have aria-label',
        colorButtons.length > 0 && allHaveAriaLabel,
        `Found ${colorButtons.length} buttons, all have aria-label: ${allHaveAriaLabel}`
    );
    
    // Test 6: Roving tabindex (only one button should be tabbable)
    const tabbableButtons = Array.from(colorButtons).filter(btn => btn.getAttribute('tabindex') === '0');
    test(
        'Roving tabindex (exactly 1 tabbable button)',
        tabbableButtons.length === 1,
        `Found ${tabbableButtons.length} tabbable button(s)`
    );
    
    // Test 7: Live region exists
    const liveRegion = document.getElementById('color-palette-live-region');
    test(
        'Live region exists',
        liveRegion !== null,
        liveRegion ? 'Found live region' : 'Live region not found'
    );
    
    // Test 8: Live region has aria-live="polite"
    test(
        'Live region has aria-live="polite"',
        liveRegion && liveRegion.getAttribute('aria-live') === 'polite',
        liveRegion ? `Found: aria-live="${liveRegion.getAttribute('aria-live')}"` : 'Live region not found'
    );
    
    // Test 9: Live region has role="status"
    test(
        'Live region has role="status"',
        liveRegion && liveRegion.getAttribute('role') === 'status',
        liveRegion ? `Found: role="${liveRegion.getAttribute('role')}"` : 'Live region not found'
    );
    
    // Test 10: Live region has aria-atomic="true"
    test(
        'Live region has aria-atomic="true"',
        liveRegion && liveRegion.getAttribute('aria-atomic') === 'true',
        liveRegion ? `Found: aria-atomic="${liveRegion.getAttribute('aria-atomic')}"` : 'Live region not found'
    );
    
    // Test 11: Live region is visually hidden
    test(
        'Live region is visually hidden',
        liveRegion && liveRegion.classList.contains('color-palette__live-region'),
        liveRegion ? 'Has proper CSS class for visual hiding' : 'Live region not found'
    );
    
    // Test 12: Color labels have aria-hidden
    const colorLabels = document.querySelectorAll('.color-palette__color-label');
    const allLabelsHidden = Array.from(colorLabels).every(label => label.getAttribute('aria-hidden') === 'true');
    test(
        'Color labels have aria-hidden="true"',
        colorLabels.length > 0 && allLabelsHidden,
        `Found ${colorLabels.length} labels, all have aria-hidden: ${allLabelsHidden}`
    );
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📝 Total:  ${results.tests.length}`);
    console.log('='.repeat(50));
    
    if (results.failed === 0) {
        console.log('🎉 All accessibility features verified successfully!');
    } else {
        console.error('⚠️  Some accessibility features need attention.');
    }
    
    return results;
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { verifyAccessibility };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
    console.log('Accessibility Verification Script Loaded');
    console.log('Run verifyAccessibility() to check all features');
}

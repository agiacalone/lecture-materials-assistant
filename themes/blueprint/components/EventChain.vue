<template>
  <!-- EventChain — horizontal numbered step cards for case-study slides.
       Props:
         steps — string[] (the emitter passes these as JSON via :steps='[...]')
       Slot:
         default — fallback when steps is empty
  -->
  <div class="bp-eventchain" role="list" :aria-label="ariaLabel">
    <!-- Non-empty steps: render card chain -->
    <template v-if="steps && steps.length > 0">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="bp-eventchain__step"
        role="listitem"
      >
        <!-- Step number badge -->
        <div class="bp-eventchain__badge" aria-hidden="true">
          {{ i + 1 }}
        </div>
        <!-- Step text -->
        <div class="bp-eventchain__text">{{ step }}</div>
        <!-- Connector arrow between steps (not after last) -->
        <div
          v-if="i < steps.length - 1"
          class="bp-eventchain__connector"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="12" x2="18" y2="12"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <polyline points="13,6 20,12 13,18"
                      fill="none" stroke="currentColor" stroke-width="1.5"
                      stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </template>

    <!-- Empty steps: render slot -->
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  /** Array of step description strings */
  steps: {
    type: Array,
    default: () => [],
  },
})

const ariaLabel = `Event chain with ${(props.steps || []).length} steps`
</script>

<style scoped>
.bp-eventchain {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.25rem;
  width: 100%;
  padding: 0.5rem 0;
}

.bp-eventchain__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1 1 0;
  min-width: 7rem;
  max-width: 14rem;
}

/* Step card */
.bp-eventchain__text {
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: var(--bp-surface-1, rgba(255,255,255,0.03));
  border: 1.5px solid var(--bp-border, rgba(53,214,232,0.18));
  border-radius: var(--bp-radius-md, 6px);
  font-family: var(--bp-font-body, 'Hanken Grotesk', sans-serif);
  font-size: 0.78rem;
  color: var(--bp-ink, #e8eef5);
  line-height: 1.45;
  text-align: center;
  /* Top accent border */
  border-top-color: var(--bp-accent, #35d6e8);
  border-top-width: 2px;
  transition: background 180ms ease, border-color 180ms ease;
}

/* Badge sits above the card */
.bp-eventchain__badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  background: var(--bp-accent, #35d6e8);
  color: var(--bp-bg, #0a1a2f);
  border-radius: 50%;
  font-family: var(--bp-font-mono, 'JetBrains Mono', monospace);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 0.3rem;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(53,214,232,0.35);
}

/* Arrow connector — sits between the step card and next card */
.bp-eventchain__connector {
  position: absolute;
  right: calc(-0.25rem - 16px);
  top: 50%;
  transform: translateY(-50%) translateY(0.75rem); /* align with card center */
  color: var(--bp-muted, #8aa0b8);
  z-index: 1;
  pointer-events: none;
}

.bp-eventchain__connector svg {
  width: 28px;
  height: 16px;
  overflow: visible;
}

/* Highlight on hover (presenter mode) */
.bp-eventchain__step:hover .bp-eventchain__text {
  background: var(--bp-surface-2, rgba(53,214,232,0.06));
  border-color: var(--bp-accent, #35d6e8);
}

/* Compact layout when many steps: smaller font + padding */
.bp-eventchain[data-count="5"] .bp-eventchain__text,
.bp-eventchain[data-count="6"] .bp-eventchain__text,
.bp-eventchain[data-count="7"] .bp-eventchain__text,
.bp-eventchain[data-count="8"] .bp-eventchain__text {
  font-size: 0.68rem;
  padding: 0.45rem 0.5rem;
}
</style>

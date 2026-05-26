<template>
  <!-- Schematic — a generic boxes-and-arrows diagram framed by alt text.
       Props:
         alt  — string caption / aria-label (required by emitter)
       Slot:
         default — optional override content (falls back to auto-generated nodes)
  -->
  <figure
    class="bp-schematic"
    :aria-label="alt"
    role="img"
  >
    <!-- Auto-generated node chain when no slot is used -->
    <div class="bp-schematic__diagram" aria-hidden="true">
      <template v-for="(node, i) in nodes" :key="i">
        <div class="bp-schematic__node">
          <span class="bp-schematic__node-label">{{ node }}</span>
        </div>
        <div v-if="i < nodes.length - 1" class="bp-schematic__arrow" aria-hidden="true">
          <svg class="bp-schematic__arrow-svg" viewBox="0 0 48 20" xmlns="http://www.w3.org/2000/svg">
            <!-- shaft -->
            <line x1="0" y1="10" x2="38" y2="10"
                  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <!-- arrowhead -->
            <polyline points="32,4 42,10 32,16"
                      fill="none" stroke="currentColor" stroke-width="1.5"
                      stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
      </template>
    </div>

    <!-- Slot override: if content is provided, render it instead of auto-nodes -->
    <div v-if="$slots.default" class="bp-schematic__slot" aria-hidden="false">
      <slot />
    </div>

    <!-- Visually-hidden accessible caption -->
    <figcaption class="bp-schematic__caption" v-if="alt">
      {{ alt }}
    </figcaption>
  </figure>
</template>

<script setup>
const props = defineProps({
  /** Accessibility caption and aria-label for the diagram */
  alt: {
    type: String,
    default: 'System diagram',
  },
})

/**
 * Derive 3 placeholder node labels from the alt text.
 * Strategy: split on delimiter words (→, >, →, to, via) to get conceptual
 * stages. If we can't find delimiters, partition the words evenly into 3 nodes.
 */
function deriveNodes(altText) {
  // Try splitting on arrow / directional delimiters
  const parts = altText
    .split(/\s*(?:→|->|»|to|via|through|then)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length >= 2 && parts.length <= 5) {
    return parts
  }

  // Partition the alt text words into 3 equal(ish) groups
  const words = altText.trim().split(/\s+/)
  if (words.length <= 3) {
    // Each word is its own node, pad up to 3 if needed
    while (words.length < 3) words.push('…')
    return words.slice(0, 3)
  }
  const sz = Math.ceil(words.length / 3)
  return [
    words.slice(0, sz).join(' '),
    words.slice(sz, sz * 2).join(' '),
    words.slice(sz * 2).join(' '),
  ]
}

const nodes = deriveNodes(props.alt)
</script>

<style scoped>
/* Uses CSS vars defined in layout.css — works with both Blueprint and Terminal */
.bp-schematic {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  border: 1px solid var(--bp-border, rgba(53,214,232,0.18));
  border-radius: var(--bp-radius-lg, 10px);
  background: var(--bp-surface-1, rgba(255,255,255,0.03));
  /* Hairline grid inside the schematic frame */
  background-image:
    linear-gradient(var(--bp-hairline, rgba(53,214,232,0.13)) 1px, transparent 1px),
    linear-gradient(90deg, var(--bp-hairline, rgba(53,214,232,0.13)) 1px, transparent 1px);
  background-size: 32px 32px;
  margin: 0.5rem 0;
  position: relative;
  width: 100%;
}

.bp-schematic__diagram {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.25rem;
  width: 100%;
}

.bp-schematic__node {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 6rem;
  max-width: 12rem;
  padding: 0.55rem 1rem;
  background: rgba(10, 26, 47, 0.85);
  border: 1.5px solid var(--bp-accent, #35d6e8);
  border-radius: var(--bp-radius-md, 6px);
  box-shadow: 0 0 10px rgba(53,214,232,0.12), inset 0 0 8px rgba(53,214,232,0.04);
  position: relative;
  /* Corner ticks — technical drawing feel */
}

.bp-schematic__node::before,
.bp-schematic__node::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  border-color: var(--bp-accent, #35d6e8);
  border-style: solid;
  opacity: 0.5;
}

.bp-schematic__node::before {
  top: -1px;
  left: -1px;
  border-width: 1.5px 0 0 1.5px;
  border-radius: 2px 0 0 0;
}

.bp-schematic__node::after {
  bottom: -1px;
  right: -1px;
  border-width: 0 1.5px 1.5px 0;
  border-radius: 0 0 2px 0;
}

.bp-schematic__node-label {
  font-family: var(--bp-font-mono, 'JetBrains Mono', monospace);
  font-size: 0.72rem;
  color: var(--bp-accent, #35d6e8);
  letter-spacing: 0.06em;
  text-align: center;
  line-height: 1.3;
  word-break: break-word;
  hyphens: auto;
}

.bp-schematic__arrow {
  display: flex;
  align-items: center;
  color: var(--bp-muted, #8aa0b8);
  flex-shrink: 0;
}

.bp-schematic__arrow-svg {
  width: 36px;
  height: 14px;
  overflow: visible;
}

.bp-schematic__slot {
  width: 100%;
}

/* Visually-hidden caption — ADA accessible, not rendered on slide */
.bp-schematic__caption {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
  border: 0;
}
</style>

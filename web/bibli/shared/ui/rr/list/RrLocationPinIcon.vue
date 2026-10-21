<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 23 23"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M10.5447 18.0896C10.5447 18.0896 16.3881 12.8954 16.3881 8.99973C16.3881 5.77246 13.7719 3.15625 10.5447 3.15625C7.31739 3.15625 4.70117 5.77246 4.70117 8.99973C4.70117 12.8954 10.5447 18.0896 10.5447 18.0896Z"
      stroke="currentColor"
      stroke-width="1.12"
    />
    <path
      d="M12.4116 8.75637C12.4116 9.7873 11.5758 10.623 10.5449 10.623C9.51396 10.623 8.67822 9.7873 8.67822 8.75637C8.67822 7.72544 9.51396 6.8897 10.5449 6.8897C11.5758 6.8897 12.4116 7.72544 12.4116 8.75637Z"
      stroke="currentColor"
      stroke-width="1.12"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  size?: number | string
}>(), {
  size: 20,
})
</script>

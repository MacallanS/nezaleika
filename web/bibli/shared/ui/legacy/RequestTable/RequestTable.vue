<template>
  <DataTable :value="requests" paginator :rows="5" :rowsPerPageOptions="[5, 10, 20, 50]" tableStyle="min-width: 50rem">
    <Column field="created" header="Создана"></Column>
    <Column field="product" header="Продукт"></Column>
    <Column field="id" header="ID заявки"></Column>
    <Column field="client" header="Клиент"></Column>
    <Column field="phone" header="Телефон клиента"></Column>
    <Column field="creator" header="Создатель"></Column>
    <Column field="status" header="Статус"></Column>
  </DataTable>
</template>

<script setup>
defineProps({
  requests: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped>
</style>
<script setup lang="ts">
import {post} from '@/utils/request'

async function debug() {
  const response = await post('/apps/c6df4fd2-8c59-499d-adec-13daa3ff161d/debug', {body: {query: '你好，你是谁'}})
}
console.log(Response)
</script>

<template>
  <a-button @click="debug">发起请求</a-button>
</template>

<style scoped></style>

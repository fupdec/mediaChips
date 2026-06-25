<template>
  <div class="mx-4">
    <SettingsCategoryDivider
      :title="t('settings_labels.library.quick_tags')"
      icon="tag-plus-outline"
    >
      <template #actions>
        <ButtonDocumentation id="sets.tools.quick_tags"/>
      </template>
    </SettingsCategoryDivider>

    <ToolQuickAddTags/>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n"
import ToolQuickAddTags from "@/tools/ToolQuickAddTags.vue"
import SettingsCategoryDivider from "@/components/ui/SettingsCategoryDivider.vue"
import ButtonDocumentation from "@/components/ui/ButtonDocumentation.vue"

const {t} = useI18n()
</script>

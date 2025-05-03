import { InputRule, inputRules } from "prosemirror-inputrules"
import { PluginKey } from "prosemirror-state"

const slashCommandTriggerPluginKey = new PluginKey("slash-command-trigger")


const slashCommandTriggerRule = new InputRule(
  /^\/$/,  
  (state, _, start, end) => {
    console.log("Slashc ommand triggered")
    const $start = state.doc.resolve(start)

    if ($start.parent.type.name === "paragraph") {
      const tr = state.tr
      tr.setMeta(slashCommandTriggerPluginKey, { isSlashCommandDialogOpen: true, endPos: end })
      return tr
    } else {
      return null
    }
  }
)


export const slashOpenCommandDialog = inputRules({
  rules: [slashCommandTriggerRule]
})


export const slashCommandTriggerKey = slashCommandTriggerPluginKey
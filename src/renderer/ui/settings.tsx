import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { useTranslation } from "preact-i18next";
import { SUPPORTED_LANGUAGES } from "../../shared/constants";
import { clearCache, getMemoryCacheSize } from "../engine/cache";
import { store, type I18nState } from "../store";

function Toggle(props: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label class="qq-i18n-toggle">
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)}
      />
      <span class="slider" />
    </label>
  );
}

function SettingRow(props: {
  label: string;
  desc?: string;
  children: preact.ComponentChildren;
}) {
  return (
    <div class="flex items-center justify-between py-2 min-h-9">
      <div>
        <div class="text-[13px]" style="color: var(--text_primary, #333)">
          {props.label}
        </div>
        {props.desc && (
          <div class="text-xs mt-0.5" style="color: var(--text_secondary, #999)">
            {props.desc}
          </div>
        )}
      </div>
      {props.children}
    </div>
  );
}

function Divider() {
  return <div class="h-px my-4" style="background: var(--border_primary, #eee)" />;
}

function Section(props: { title: string; children: preact.ComponentChildren }) {
  return (
    <div class="mb-6">
      <h3 class="text-sm font-semibold mb-3" style="color: var(--text_primary, #333)">
        {props.title}
      </h3>
      {props.children}
    </div>
  );
}

function Select(props: {
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<{ code: string; label: string }>;
}) {
  return (
    <select
      class="px-2 py-1 rounded border text-[13px] min-w-40"
      style="border-color: var(--border_primary, #ddd); background: var(--bg_bottom_standard, #fff); color: var(--text_primary, #333)"
      value={props.value}
      onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}
    >
      {props.options.map((o) => (
        <option key={o.code} value={o.code}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Button(props: {
  children: preact.ComponentChildren;
  variant?: "primary" | "danger";
  onClick: () => void;
}) {
  const base = "px-3 py-1 rounded border text-[13px] cursor-pointer transition-colors";
  const variants = {
    primary:
      "text-white border-transparent" +
      " [background:var(--brand_standard,#0099ff)]" +
      " hover:[background:var(--brand_hover,#007acc)]",
    danger: "border-current [color:var(--function_error,#ff4d4f)]",
    default:
      "[border-color:var(--border_primary,#ddd)]" +
      " [background:var(--bg_bottom_standard,#fff)]" +
      " [color:var(--text_primary,#333)]" +
      " hover:[background:var(--overlay_hover,#f5f5f5)]",
  };
  return (
    <button
      class={`${base} ${variants[props.variant ?? "default"]}`}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}

function Settings() {
  const { t } = useTranslation();
  const [state, setState] = useState<I18nState>(store.getState());
  const [apiInput, setApiInput] = useState(state.apiUrl);

  useEffect(() => {
    return store.subscribe((s) => setState({ ...s }));
  }, []);

  const hitRate =
    state.cacheHits + state.cacheMisses > 0
      ? (
          (state.cacheHits / (state.cacheHits + state.cacheMisses)) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div class="p-5">
      <Section title={t("plugin.translation")}>
        <SettingRow label={t("plugin.enable")} desc={t("plugin.enableDesc")}>
          <Toggle checked={state.enabled} onChange={(v) => state.setEnabled(v)} />
        </SettingRow>

        <SettingRow label={t("plugin.sourceLang")}>
          <Select
            value={state.sourceLang}
            onChange={(v) => state.setSourceLang(v)}
            options={SUPPORTED_LANGUAGES}
          />
        </SettingRow>

        <SettingRow label={t("plugin.targetLang")}>
          <Select
            value={state.targetLang}
            onChange={(v) => state.setTargetLang(v)}
            options={SUPPORTED_LANGUAGES}
          />
        </SettingRow>

        <Divider />

        <SettingRow label={t("plugin.translateUI")} desc={t("plugin.translateUIDesc")}>
          <Toggle
            checked={state.translateUILabels}
            onChange={(v) => state.setTranslateUILabels(v)}
          />
        </SettingRow>

        <SettingRow label={t("plugin.translatePreviews")} desc={t("plugin.translatePreviewsDesc")}>
          <Toggle
            checked={state.translateChatPreviews}
            onChange={(v) => state.setTranslateChatPreviews(v)}
          />
        </SettingRow>

        <SettingRow label={t("plugin.translateMessages")} desc={t("plugin.translateMessagesDesc")}>
          <Toggle
            checked={state.translateChatMessages}
            onChange={(v) => state.setTranslateChatMessages(v)}
          />
        </SettingRow>
      </Section>

      <Section title={t("plugin.api")}>
        <div class="text-xs" style="color: var(--text_secondary, #999)">
          {t("plugin.apiDesc")}
        </div>
        <div class="flex gap-2 mt-2">
          <input
            type="text"
            class="flex-1 px-2 py-1 rounded border text-[13px]"
            style="border-color: var(--border_primary, #ddd); background: var(--bg_bottom_standard, #fff); color: var(--text_primary, #333)"
            value={apiInput}
            onInput={(e) => setApiInput((e.target as HTMLInputElement).value)}
          />
          <Button variant="primary" onClick={() => state.setApiUrl(apiInput.trim())}>
            {t("plugin.apply")}
          </Button>
        </div>
      </Section>

      <Section title={t("plugin.stats")}>
        <div class="grid grid-cols-2 gap-2">
          {[
            [t("plugin.cachedTranslations"), getMemoryCacheSize()],
            [t("plugin.translatedElements"), state.translatedElements],
            [t("plugin.apiCalls"), state.apiCalls],
            [t("plugin.cacheHitRate"), `${hitRate}%`],
            [t("plugin.queue"), state.queueLength],
            [t("plugin.apiErrors"), state.apiErrors],
          ].map(([label, value]) => (
            <div key={label as string} class="flex justify-between py-1.5 text-[13px]">
              <span>{label}</span>
              <span class="tabular-nums" style="color: var(--text_secondary, #999)">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div class="mt-3">
          <Button
            variant="danger"
            onClick={async () => {
              await clearCache();
              setState({ ...store.getState() });
            }}
          >
            {t("plugin.clearCache")}
          </Button>
        </div>
      </Section>

      <div class="text-xs text-center mt-4" style="color: var(--text_secondary, #999)">
        QQ i18n v{LiteLoader.plugins.qq_i18n?.manifest?.version ?? "0.1.0"}
      </div>
    </div>
  );
}

export function mountSettings(container: HTMLDivElement): void {
  render(<Settings />, container);
}

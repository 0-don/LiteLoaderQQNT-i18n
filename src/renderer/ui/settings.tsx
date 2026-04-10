import { render, type ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { SUPPORTED_LANGUAGES, type LangCode } from "../../shared/constants";
import { LL_ATTR } from "../../shared/selectors";
import { clearCache, getMemoryCacheSize } from "../engine/cache";
import { store, type I18nState } from "../store";
import { useTranslation } from "./i18n";

function Switch(props: { active: boolean; onChange: (v: boolean) => void }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => {
      const current = el.hasAttribute(LL_ATTR.IS_ACTIVE);
      if (current) el.removeAttribute(LL_ATTR.IS_ACTIVE);
      else el.setAttribute(LL_ATTR.IS_ACTIVE, "");
      props.onChange(!current);
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [props.onChange]);

  return (
    <setting-switch
      ref={ref}
      {...(props.active ? { [LL_ATTR.IS_ACTIVE]: "" } : {})}
    />
  );
}

function Select(props: {
  value: string;
  options: ReadonlyArray<{ code: string; label: string }>;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: Event) =>
      props.onChange((e as CustomEvent).detail.value);
    el.addEventListener("selected", handler);
    return () => el.removeEventListener("selected", handler);
  }, [props.onChange]);

  return (
    <setting-select ref={ref}>
      {props.options.map((o) => (
        <setting-option
          key={o.code}
          data-value={o.code}
          {...(o.code === props.value ? { [LL_ATTR.IS_SELECTED]: "" } : {})}
        >
          {o.label}
        </setting-option>
      ))}
    </setting-select>
  );
}

function SwitchItem(props: {
  label: string;
  desc: string;
  active: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <setting-item>
      <div>
        <setting-text>{props.label}</setting-text>
        <setting-text data-type="secondary">{props.desc}</setting-text>
      </div>
      <Switch active={props.active} onChange={props.onChange} />
    </setting-item>
  );
}

function SelectItem(props: {
  label: string;
  value: string;
  options: ReadonlyArray<{ code: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <setting-item>
      <setting-text>{props.label}</setting-text>
      <Select
        value={props.value}
        options={props.options}
        onChange={props.onChange}
      />
    </setting-item>
  );
}

function StatItem(props: { label: string; value: string | number }) {
  return (
    <setting-item>
      <setting-text>{props.label}</setting-text>
      <setting-text data-type="secondary">{String(props.value)}</setting-text>
    </setting-item>
  );
}

function Panel(props: { children: ComponentChildren }) {
  return (
    <setting-panel>
      <setting-list data-direction="column">{props.children}</setting-list>
    </setting-panel>
  );
}

function Settings() {
  const { t } = useTranslation();
  const [state, setState] = useState<I18nState>(store.getState());
  const [apiInput, setApiInput] = useState(state.apiUrl);

  useEffect(() => {
    return store.subscribe((s) => setState({ ...s }));
  }, []);

  const total = state.cacheHits + state.cacheMisses;
  const hitRate =
    total > 0 ? `${((state.cacheHits / total) * 100).toFixed(1)}%` : "0%";

  return (
    <div>
      <setting-section data-title={t("翻译设置")}>
        <Panel>
          <SwitchItem
            label={t("启用翻译")}
            desc={t("将QQ界面翻译为你的语言")}
            active={state.enabled}
            onChange={(v) => state.setEnabled(v)}
          />
          <SelectItem
            label={t("目标语言")}
            value={state.targetLang}
            options={SUPPORTED_LANGUAGES}
            onChange={(v) => state.setTargetLang(v as LangCode)}
          />
        </Panel>
        <Panel>
          <SwitchItem
            label={t("翻译界面标签")}
            desc={t("按钮、菜单、导航栏")}
            active={state.translateUILabels}
            onChange={(v) => state.setTranslateUILabels(v)}
          />
          <SwitchItem
            label={t("翻译聊天预览")}
            desc={t("侧边栏消息预览")}
            active={state.translateChatPreviews}
            onChange={(v) => state.setTranslateChatPreviews(v)}
          />
          <SwitchItem
            label={t("翻译聊天消息")}
            desc={t("完整消息内容（API调用较多）")}
            active={state.translateChatMessages}
            onChange={(v) => state.setTranslateChatMessages(v)}
          />
        </Panel>
      </setting-section>

      <setting-section data-title={t("API配置")}>
        <Panel>
          <setting-item>
            <setting-text>{t("DeepLX翻译接口地址")}</setting-text>
          </setting-item>
          <setting-item>
            <div class="flex w-full gap-2 items-center">
              <input
                type="text"
                value={apiInput}
                placeholder="https://deepl.mukapp.top"
                onInput={(e) =>
                  setApiInput((e.target as HTMLInputElement).value)
                }
                class="flex-1 py-1.5 px-3 rounded text-[13px] outline-none border border-(--border_dark,#555) bg-(--fill_light_primary,#2a2a2a) text-(--text_primary,#ddd)"
              />
              <setting-button onClick={() => state.setApiUrl(apiInput.trim())}>
                {t("应用")}
              </setting-button>
            </div>
          </setting-item>
        </Panel>
      </setting-section>

      <setting-section data-title={t("统计数据")}>
        <Panel>
          <StatItem label={t("已缓存翻译")} value={getMemoryCacheSize()} />
          <StatItem label={t("已翻译元素")} value={state.translatedElements} />
          <StatItem label={t("API调用次数")} value={state.apiCalls} />
          <StatItem label={t("缓存命中率")} value={hitRate} />
          <StatItem label={t("队列")} value={state.queueLength} />
          <StatItem label={t("API错误")} value={state.apiErrors} />
        </Panel>
        <Panel>
          <setting-item>
            <setting-text>{t("清除翻译缓存")}</setting-text>
            <setting-button
              data-type="secondary"
              onClick={async () => {
                await clearCache();
                setState({ ...store.getState() });
              }}
            >
              {t("清除翻译缓存")}
            </setting-button>
          </setting-item>
        </Panel>
      </setting-section>

      <setting-text
        data-type="secondary"
        style={{ display: "block", textAlign: "center", marginTop: "16px" }}
      >
        QQ i18n v{LiteLoader.plugins["liteloaderqqnt-i18n"]?.manifest?.version ?? "0.0.0"}
      </setting-text>
    </div>
  );
}

export function mountSettings(container: HTMLDivElement): void {
  render(<Settings />, container);
}

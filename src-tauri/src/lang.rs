use std::sync::OnceLock;

pub fn spanish() -> bool {
    static SPANISH: OnceLock<bool> = OnceLock::new();
    *SPANISH.get_or_init(|| {
        #[cfg(windows)]
        {
            // The primary language is the low 10 bits of the LANGID; 0x0A is Spanish.
            (unsafe { windows::Win32::Globalization::GetUserDefaultUILanguage() } & 0x3ff) == 0x0a
        }

        #[cfg(not(windows))]
        {
            ["LC_ALL", "LC_MESSAGES", "LANG"]
                .iter()
                .find_map(|name| std::env::var(name).ok().filter(|v| !v.is_empty()))
                .is_some_and(|lang| lang.starts_with("es"))
        }
    })
}

pub fn t(es: &'static str, en: &'static str) -> &'static str {
    if spanish() {
        es
    } else {
        en
    }
}

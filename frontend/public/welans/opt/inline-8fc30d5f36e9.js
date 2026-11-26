
			(function() {
				// Always start from a fresh object: a `||` fallback would keep a same-named DOM element alive.
				window.wcAnalytics = {};
				const wcAnalytics = window.wcAnalytics;

				// Set the assets URL for webpack to find the split assets.
				wcAnalytics.assets_url = 'https://welans.ru/wp-content/plugins/jetpack/jetpack_vendor/automattic/woocommerce-analytics/src/../build/';

				// Set the REST API tracking endpoint URL.
								wcAnalytics.trackEndpoint = "https://welans.ru/wp-json/woocommerce-analytics/v1/track";

				// Set common properties for all events.
				wcAnalytics.commonProps = {"ui":0,"blog_id":214020532,"store_id":"5d1db11b-710b-4441-8685-eb8b02acc426","url":"https://welans.ru","woo_version":"11.2.1","wp_version":"7.1.3","store_admin":0,"device":"desktop","store_currency":"RUB","timezone":"+03:00","is_guest":1,"package_version":"0.18.0"};

				// Set the event queue.
				wcAnalytics.eventQueue = [];

				// Features.
				wcAnalytics.features = {
					ch: false,
					sessionTracking: false,
					proxy: false,
				};

				wcAnalytics.breadcrumbs = ["Home"];

				// Page context flags.
				wcAnalytics.pages = {
					isAccountPage: false,
					isCart: false,
				};
			})();
		
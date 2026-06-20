PYTHON ?= python3

.PHONY: demo lint test static-demo

demo:
	PYTHON=$(PYTHON) ./scripts/run_demo.sh

lint:
	$(PYTHON) -m ruff check refund_demo tests

test:
	$(PYTHON) -m pytest

static-demo:
	rm -rf dist
	mkdir -p dist/static
	cp refund_demo/static/index.html dist/index.html
	cp refund_demo/static/app.js refund_demo/static/styles.css refund_demo/static/social-preview.svg dist/static/

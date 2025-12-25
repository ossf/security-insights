lintcue:
	@echo "  >  Linting CUE schema ..."
	@cd spec
	@cue vet ./spec --all-errors --verbose

lintyml:
	@echo "  >  Linting YAML files ..."
	@echo "  >  Linting .github/security-insights.yml ..."
	@cue vet -d '#SecurityInsights' ./spec .github/security-insights.yml
	@echo "  >  Linting template-full.yml ..."
	cue vet -d '#SecurityInsights' ./spec examples/example-full.yml
	@echo "  >  Linting template-minimum.yml ..."
	cue vet -d '#SecurityInsights' ./spec examples/example-minimum.yml
	@echo "  >  Linting template-multi-repository-project-reuse.yml ..."
	cue vet -d '#SecurityInsights' ./spec examples/example-multi-repository-project-reuse.yml
	@echo "  >  Linting template-multi-repository-project.yml ..."
	cue vet -d '#SecurityInsights' ./spec examples/example-multi-repository-project.yml

cuegen:
	@echo "  >  Generating types from cue schema ..."
	@cue exp gengotypes spec/schema.cue
	@echo "  >  vet the generated go types ..."
	@go vet cue_types_gen.go

genopenapi:
	@echo "  >  Converting CUE schema to OpenAPI ..."
	@cd cmd/cue2openapi && go run . -schema ../../spec/schema.cue -output ../../openapi.yaml
	@echo "  >  OpenAPI schema generation complete!"

gendocs: genopenapi
	@echo "  >  Generating markdown from OpenAPI ..."
	@cd cmd/openapi2md && go run . -input ../../openapi.yaml -output ../../spec
	@echo "  >  Documentation generation complete!"

genpdf: gendocs
	@echo "  >  Generating PDF from markdown documentation ..."
	@if ! command -v pandoc >/dev/null 2>&1; then \
		echo "ERROR: pandoc not found. Install pandoc to generate PDF."; \
		echo "  macOS: brew install pandoc"; \
		echo "  Linux: apt-get install pandoc or yum install pandoc"; \
		exit 1; \
	fi
	@VERSION=$$(grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+' spec/schema.md 2>/dev/null | head -1 || echo "v2.0.0"); \
	PDF_ENGINE=""; \
	if command -v pdflatex >/dev/null 2>&1; then \
		PDF_ENGINE="pdflatex"; \
	elif command -v xelatex >/dev/null 2>&1; then \
		PDF_ENGINE="xelatex"; \
	elif command -v lualatex >/dev/null 2>&1; then \
		PDF_ENGINE="lualatex"; \
	elif command -v wkhtmltopdf >/dev/null 2>&1; then \
		PDF_ENGINE="wkhtmltopdf"; \
	elif command -v weasyprint >/dev/null 2>&1; then \
		PDF_ENGINE="weasyprint"; \
	fi; \
	if [ -z "$$PDF_ENGINE" ]; then \
		echo "  >  No PDF engine found (pdflatex, xelatex, lualatex, wkhtmltopdf, or weasyprint)."; \
		echo "  >  Generating HTML instead (convert to PDF manually)..."; \
		cd spec && pandoc schema.md \
			--from markdown \
			--to html \
			--standalone \
			--toc \
			--toc-depth=3 \
			--css=https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css \
			--metadata title="Security Insights Specification" \
			--metadata author="OpenSSF" \
			--metadata date="$$(date +%Y-%m-%d)" \
			--output ../Security-Insights-$$VERSION.html; \
		echo "  >  HTML generated at Security-Insights-$$VERSION.html"; \
		echo "  >  To generate PDF, install a PDF engine:"; \
		echo "     macOS: brew install basictex (for pdflatex/xelatex/lualatex)"; \
		echo "     macOS: brew install wkhtmltopdf (for wkhtmltopdf)"; \
		echo "     Linux: apt-get install texlive (for pdflatex/xelatex/lualatex)"; \
	else \
		echo "  >  Using PDF engine: $$PDF_ENGINE"; \
		cd spec && pandoc schema.md \
			--from markdown \
			--to pdf \
			--output ../Security-Insights-$$VERSION.pdf \
			--toc \
			--toc-depth=3 \
			--pdf-engine=$$PDF_ENGINE \
			-V geometry:margin=1in \
			-V documentclass=article \
			-V fontsize=11pt \
			--metadata title="Security Insights Specification" \
			--metadata author="OpenSSF" \
			--metadata date="$$(date +%Y-%m-%d)" 2>&1 | grep -v "LaTeX Warning" || \
		(echo "  >  PDF generation with $$PDF_ENGINE failed. Trying HTML fallback..." && \
		 pandoc schema.md \
			--from markdown \
			--to html \
			--standalone \
			--toc \
			--toc-depth=3 \
			--css=https://cdn.jsdelivr.net/npm/github-markdown-css@5/github-markdown.min.css \
			--metadata title="Security Insights Specification" \
			--metadata author="OpenSSF" \
			--metadata date="$$(date +%Y-%m-%d)" \
			--output ../Security-Insights-$$VERSION.html && \
		 echo "  >  HTML generated at Security-Insights-$$VERSION.html (convert to PDF manually)" && \
		 echo "  >  Install LaTeX for better PDF generation: brew install basictex (macOS) or texlive (Linux)"); \
	fi
	@echo "  >  PDF generation complete!"

PHONY: lintcue lintyml cuegen genopenapi gendocs genpdf

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

PHONY: lintcue lintyml cuegen

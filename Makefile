lintcue:
	@echo "  >  Linting CUE schema ..."
	@cue vet . --all-errors --verbose

lintyml:
	@echo "  >  Linting YAML files ..."
	@echo "  >  Linting .github/security-insights.yml ..."
	@cue vet -d '#SecurityInsights' . .github/security-insights.yml
	@echo "  >  Linting template-full.yml ..."
	cue vet -d '#SecurityInsights' . template-full.yml
	@echo "  >  Linting template-minimum.yml ..."
	cue vet -d '#SecurityInsights' . template-minimum.yml
	@echo "  >  Linting template-multi-repository-project-reuse.yml ..."
	cue vet -d '#SecurityInsights' . template-multi-repository-project-reuse.yml
	@echo "  >  Linting template-multi-repository-project.yml ..."
	cue vet -d '#SecurityInsights' . template-multi-repository-project.yml

cuegen:
	@echo "  >  Generating types from cue schema ..."
	@cue exp gengotypes schema.cue
	@echo "  >  vet the generated go types ..."
	@go vet cue_types_gen.go

PHONY: lintcue lintyml cuegen

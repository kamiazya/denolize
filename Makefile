.PHONY: fmt test doc

fmt:
	@deno fmt

test:
	@deno test --unstable

doc:
	@deno doc ./mod.ts

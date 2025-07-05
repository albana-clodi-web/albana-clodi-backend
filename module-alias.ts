import path from "node:path";
import moduleAlias from "module-alias";

if (process.env.NODE_ENV === "production") {
	moduleAlias.addAliases({
		"@": path.join(__dirname, "src"),
	});
} else {
	moduleAlias.addAliases({
		"@": path.join(__dirname, "src"),
	});
}

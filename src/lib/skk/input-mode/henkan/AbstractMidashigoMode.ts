import { AbstractHenkanMode } from "./AbstractHenkanMode";

export abstract class AbstractMidashigoMode extends AbstractHenkanMode {
    abstract resetOkuriState(): void;
}
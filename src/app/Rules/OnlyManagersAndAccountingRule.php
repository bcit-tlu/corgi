<?php

namespace App\Rules;

use Adldap\Laravel\Validation\Rules\Rule;

class OnlyManagersAndAccountingRule extends Rule
{
    /**
     * Determines if the user is allowed to authenticate.
     *
     * @return bool
     */   
    public function isValid()
    {
        return \App\User::isValidUser($this->user);
    }
}